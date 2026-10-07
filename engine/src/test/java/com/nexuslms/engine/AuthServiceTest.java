package com.nexuslms.engine;

import com.nexuslms.engine.dto.AuthResponse;
import com.nexuslms.engine.dto.LoginRequest;
import com.nexuslms.engine.exception.InvalidRequestException;
import com.nexuslms.engine.models.Role;
import com.nexuslms.engine.models.Tenant;
import com.nexuslms.engine.models.User;
import com.nexuslms.engine.repository.TenantRepository;
import com.nexuslms.engine.repository.UserRepository;
import com.nexuslms.engine.service.AuthService;
import com.nexuslms.engine.service.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock TenantRepository tenantRepository;
    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @InjectMocks AuthService service;

    private final LoginRequest request = new LoginRequest("lincoln", "A@B.com", "pw");

    private Tenant tenant() {
        Tenant t = new Tenant();
        t.setId("t1");
        t.setName("Lincoln");
        t.setSubdomain("lincoln");
        return t;
    }

    private User user(boolean active) {
        User u = new User();
        u.setId("u1");
        u.setTenantId("t1");
        u.setName("Admin");
        u.setEmail("a@b.com");
        u.setPassword("hash");
        u.setRole(Role.ADMIN);
        u.setActive(active);
        return u;
    }

    private User waitingTeacher() {
        User u = user(true);
        u.setName("Mr Bello");
        u.setRole(Role.TEACHER);
        u.setApproved(false);
        return u;
    }

    private String failureMessage() {
        return assertThrows(BadCredentialsException.class, () -> service.login(request)).getMessage();
    }

    @Test
    void logsInWithCorrectDetails() {
        when(tenantRepository.findBySubdomain("lincoln")).thenReturn(Optional.of(tenant()));
        when(userRepository.findByEmailAndTenantId("a@b.com", "t1")).thenReturn(Optional.of(user(true)));
        when(passwordEncoder.matches("pw", "hash")).thenReturn(true);
        when(jwtService.generateToken("u1", "a@b.com", "ADMIN", "t1")).thenReturn("token");

        AuthResponse response = service.login(request);

        assertEquals("token", response.token());
        assertEquals("Admin", response.user().name());
    }

    @Test
    void everyFailureGivesTheSameMessage() {
        // unknown school
        when(tenantRepository.findBySubdomain("lincoln")).thenReturn(Optional.empty());
        String unknownSchool = failureMessage();

        // unknown user
        when(tenantRepository.findBySubdomain("lincoln")).thenReturn(Optional.of(tenant()));
        when(userRepository.findByEmailAndTenantId("a@b.com", "t1")).thenReturn(Optional.empty());
        String unknownUser = failureMessage();

        // wrong password
        when(userRepository.findByEmailAndTenantId("a@b.com", "t1")).thenReturn(Optional.of(user(true)));
        when(passwordEncoder.matches("pw", "hash")).thenReturn(false);
        String wrongPassword = failureMessage();

        // disabled user
        when(userRepository.findByEmailAndTenantId("a@b.com", "t1")).thenReturn(Optional.of(user(false)));
        String disabled = failureMessage();

        assertEquals("Invalid email or password", unknownSchool);
        assertEquals(unknownSchool, unknownUser);
        assertEquals(unknownSchool, wrongPassword);
        assertEquals(unknownSchool, disabled);
    }

    @Test
    void meRejectsMissingOrUnknownUsers() {
        when(userRepository.findById("gone")).thenReturn(Optional.empty());

        assertThrows(BadCredentialsException.class, () -> service.me(null));
        assertThrows(BadCredentialsException.class, () -> service.me("gone"));
    }

    @Test
    void aTeacherWhoIsStillWaiting_IsToldSoOnlyAfterTheRightPassword() {
        when(tenantRepository.findBySubdomain("lincoln")).thenReturn(Optional.of(tenant()));
        when(userRepository.findByEmailAndTenantId("a@b.com", "t1")).thenReturn(Optional.of(waitingTeacher()));
        when(passwordEncoder.matches("pw", "hash")).thenReturn(true);

        InvalidRequestException e = assertThrows(InvalidRequestException.class, () -> service.login(request));

        assertTrue(e.getMessage().contains("waiting for approval"));
        verify(jwtService, never()).generateToken(any(), any(), any(), any());
    }

    @Test
    void aWaitingTeacherWithTheWrongPassword_GetsTheSameVagueMessageAsEveryoneElse() {
        when(tenantRepository.findBySubdomain("lincoln")).thenReturn(Optional.of(tenant()));
        when(userRepository.findByEmailAndTenantId("a@b.com", "t1")).thenReturn(Optional.of(waitingTeacher()));
        when(passwordEncoder.matches("pw", "hash")).thenReturn(false);

        assertEquals("Invalid email or password", failureMessage());
    }

    @Test
    void meRejectsAUserWhoIsNotApproved() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(waitingTeacher()));

        assertThrows(BadCredentialsException.class, () -> service.me("u1"));
    }
}