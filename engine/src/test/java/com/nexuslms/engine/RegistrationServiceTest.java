package com.nexuslms.engine;

import com.nexuslms.engine.dto.RegisterSchoolRequest;
import com.nexuslms.engine.dto.ResendRequest;
import com.nexuslms.engine.dto.VerifyRegistrationRequest;
import com.nexuslms.engine.exception.DuplicateResourceException;
import com.nexuslms.engine.exception.InvalidRequestException;
import com.nexuslms.engine.exception.TooManyRequestsException;
import com.nexuslms.engine.models.PendingRegistration;
import com.nexuslms.engine.models.Role;
import com.nexuslms.engine.models.Tenant;
import com.nexuslms.engine.models.User;
import com.nexuslms.engine.repository.PendingRegistrationRepository;
import com.nexuslms.engine.service.EmailService;
import com.nexuslms.engine.service.RegistrationService;
import com.nexuslms.engine.service.TenantService;
import com.nexuslms.engine.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RegistrationServiceTest {

    @Mock TenantService tenantService;
    @Mock UserService userService;
    @Mock PendingRegistrationRepository pendingRepository;
    @Mock EmailService emailService;

    private final PasswordEncoder encoder = new BCryptPasswordEncoder();
    private final Map<String, PendingRegistration> store = new HashMap<>();
    private RegistrationService service;

    @BeforeEach
    void setUp() {
        service = new RegistrationService(tenantService, userService, pendingRepository, encoder, emailService);

        // a tiny in-memory stand-in for the pending_registrations collection
        when(pendingRepository.findById(anyString()))
                .thenAnswer(i -> Optional.ofNullable(store.get(i.<String>getArgument(0))));
        when(pendingRepository.save(any())).thenAnswer(i -> {
            PendingRegistration p = i.getArgument(0);
            store.put(p.getSubdomain(), p);
            return p;
        });
        doAnswer(i -> store.remove(i.<String>getArgument(0))).when(pendingRepository).deleteById(anyString());

        when(tenantService.createTenant(any())).thenAnswer(i -> {
            Tenant t = i.getArgument(0);
            t.setId("t1");
            return t;
        });
        when(userService.createUserHashed(any())).thenAnswer(i -> i.getArgument(0));
    }

    private RegisterSchoolRequest request(String subdomain, String email) {
        return new RegisterSchoolRequest("Lincoln High School", subdomain, email, "password123");
    }

    private RegisterSchoolRequest request() {
        return request("lincoln", "Head@Lincoln.edu");
    }

    /** Starts a registration and returns the code that was emailed. */
    private String startAndGetCode() {
        service.start(request());
        ArgumentCaptor<String> code = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendVerificationCode(eq("head@lincoln.edu"), eq("Lincoln High School"), code.capture());
        return code.getValue();
    }

    private String wrongCodeFor(String code) {
        return code.equals("000000") ? "111111" : "000000";
    }

    // ----- start -----

    @Test
    void startHoldsHashedDetailsAndEmailsASixDigitCode() {
        String code = startAndGetCode();
        PendingRegistration pending = store.get("lincoln");

        assertTrue(code.matches("\\d{6}"));
        assertNotEquals(code, pending.getCodeHash());
        assertTrue(encoder.matches(code, pending.getCodeHash()));
        assertNotEquals("password123", pending.getPasswordHash());
        assertTrue(encoder.matches("password123", pending.getPasswordHash()));
        assertEquals("head@lincoln.edu", pending.getEmail());
        assertTrue(pending.getExpiresAt().isAfter(Instant.now()));
        verify(tenantService, never()).createTenant(any());
        verify(userService, never()).createUserHashed(any());
    }

    @Test
    void startRejectsReservedAddresses() {
        assertThrows(InvalidRequestException.class, () -> service.start(request("admin", "a@b.com")));
        verifyNoInteractions(emailService);
    }

    @Test
    void startRejectsTakenAddresses() {
        when(tenantService.isSubdomainTaken("lincoln")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> service.start(request()));
        verifyNoInteractions(emailService);
    }

    @Test
    void startRejectsEmailsThatAlreadyHaveAnAccount() {
        when(userService.isEmailInUse("head@lincoln.edu")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> service.start(request()));
        verifyNoInteractions(emailService);
    }

    @Test
    void startRefusesAnAddressSomeoneElseIsRegistering() {
        service.start(request());

        assertThrows(DuplicateResourceException.class, () -> service.start(request("lincoln", "other@school.edu")));
    }

    @Test
    void startingAgainTooSoonIsRefused() {
        service.start(request());

        assertThrows(TooManyRequestsException.class, () -> service.start(request()));
    }

    @Test
    void availabilityCountsAddressesThatAreBeingRegistered() {
        service.start(request());

        assertFalse(service.availability("lincoln").available());
        assertFalse(service.availability("admin").available());
        assertTrue(service.availability("another-school").available());
    }

    // ----- verify -----

    @Test
    void aRightCodeCreatesTheSchoolAndAnAdmin() {
        String code = startAndGetCode();

        var result = service.verify(new VerifyRegistrationRequest("lincoln", code));

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userService).createUserHashed(captor.capture());
        User admin = captor.getValue();
        assertEquals("lincoln", result.subdomain());
        assertEquals(Role.ADMIN, admin.getRole());
        assertEquals("Admin", admin.getName());
        assertEquals("t1", admin.getTenantId());
        assertEquals("head@lincoln.edu", admin.getEmail());
        assertTrue(encoder.matches("password123", admin.getPassword()));
        assertTrue(store.isEmpty());
    }

    @Test
    void wrongCodesAreCountedAndLockTheRegistrationAfterFive() {
        String wrong = wrongCodeFor(startAndGetCode());

        for (int i = 1; i <= 4; i++) {
            assertThrows(InvalidRequestException.class, () -> service.verify(new VerifyRegistrationRequest("lincoln", wrong)));
            assertEquals(i, store.get("lincoln").getAttempts());
        }
        InvalidRequestException locked = assertThrows(InvalidRequestException.class,
                () -> service.verify(new VerifyRegistrationRequest("lincoln", wrong)));

        assertTrue(locked.getMessage().contains("Too many"));
        assertTrue(store.isEmpty());
        verify(userService, never()).createUserHashed(any());
    }

    @Test
    void anExpiredCodeIsRejectedAndCleanedUp() {
        String code = startAndGetCode();
        store.get("lincoln").setExpiresAt(Instant.now().minusSeconds(1));

        assertThrows(InvalidRequestException.class, () -> service.verify(new VerifyRegistrationRequest("lincoln", code)));
        assertTrue(store.isEmpty());
    }

    @Test
    void theSchoolIsRemovedIfTheAdminCannotBeCreated() {
        String code = startAndGetCode();
        when(userService.createUserHashed(any())).thenThrow(new RuntimeException("database down"));

        assertThrows(RuntimeException.class, () -> service.verify(new VerifyRegistrationRequest("lincoln", code)));
        verify(tenantService).deleteTenant("t1");
    }

    // ----- resend -----

    @Test
    void resendIsRefusedDuringTheCooldown() {
        startAndGetCode();

        assertThrows(TooManyRequestsException.class, () -> service.resend(new ResendRequest("lincoln")));
    }

    @Test
    void resendAfterTheCooldownSendsAFreshCodeAndTheOldOneStopsWorking() {
        String firstCode = startAndGetCode();
        store.get("lincoln").setLastSentAt(Instant.now().minusSeconds(61));

        service.resend(new ResendRequest("lincoln"));

        ArgumentCaptor<String> codes = ArgumentCaptor.forClass(String.class);
        verify(emailService, times(2)).sendVerificationCode(eq("head@lincoln.edu"), anyString(), codes.capture());
        String secondCode = codes.getAllValues().get(1);
        assertTrue(encoder.matches(secondCode, store.get("lincoln").getCodeHash()));
        if (!firstCode.equals(secondCode)) {
            assertFalse(encoder.matches(firstCode, store.get("lincoln").getCodeHash()));
        }
    }

    @Test
    void resendWithNothingPendingTellsThemToStartAgain() {
        assertThrows(InvalidRequestException.class, () -> service.resend(new ResendRequest("lincoln")));
    }
}