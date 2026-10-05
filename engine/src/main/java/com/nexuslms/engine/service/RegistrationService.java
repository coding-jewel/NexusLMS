package com.nexuslms.engine.service;

import com.nexuslms.engine.dto.AvailabilityResponse;
import com.nexuslms.engine.dto.PendingRegistrationResponse;
import com.nexuslms.engine.dto.RegisterSchoolRequest;
import com.nexuslms.engine.dto.RegistrationResponse;
import com.nexuslms.engine.dto.ResendRequest;
import com.nexuslms.engine.dto.VerifyRegistrationRequest;
import com.nexuslms.engine.exception.DuplicateResourceException;
import com.nexuslms.engine.exception.EmailDeliveryException;
import com.nexuslms.engine.exception.InvalidRequestException;
import com.nexuslms.engine.exception.TooManyRequestsException;
import com.nexuslms.engine.models.PendingRegistration;
import com.nexuslms.engine.models.Role;
import com.nexuslms.engine.models.Tenant;
import com.nexuslms.engine.models.User;
import com.nexuslms.engine.repository.PendingRegistrationRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

@Service
public class RegistrationService {
    static final int CODE_MINUTES = 15;
    static final int MAX_ATTEMPTS = 5;
    static final int RESEND_SECONDS = 60;
    private static final String EXPIRED = "This code has expired. Please register again.";
    private static final String BEING_REGISTERED = "That address is being registered right now. Try again in a few minutes.";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final TenantService tenantService;
    private final UserService userService;
    private final PendingRegistrationRepository pendingRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public RegistrationService(TenantService tenantService, UserService userService,
                               PendingRegistrationRepository pendingRepository,
                               PasswordEncoder passwordEncoder, EmailService emailService) {
        this.tenantService = tenantService;
        this.userService = userService;
        this.pendingRepository = pendingRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    public AvailabilityResponse availability(String rawSubdomain) {
        String subdomain = SubdomainRules.normalize(rawSubdomain);
        String problem = SubdomainRules.problem(subdomain);
        if (problem != null) {
            return new AvailabilityResponse(false, problem);
        }
        if (tenantService.isSubdomainTaken(subdomain)) {
            return new AvailabilityResponse(false, "That address is already taken.");
        }
        if (pendingRepository.findById(subdomain).filter(this::isLive).isPresent()) {
            return new AvailabilityResponse(false, BEING_REGISTERED);
        }
        return new AvailabilityResponse(true, null);
    }

    /** Step 1: hold the details and email a code. Nothing real is created yet. */
    public PendingRegistrationResponse start(RegisterSchoolRequest request) {
        String subdomain = SubdomainRules.normalize(request.subdomain());
        String problem = SubdomainRules.problem(subdomain);
        if (problem != null) {
            throw new InvalidRequestException(problem);
        }
        String email = request.email().trim().toLowerCase();

        if (tenantService.isSubdomainTaken(subdomain)) {
            throw new DuplicateResourceException("That address is already taken.");
        }
        if (userService.isEmailInUse(email)) {
            throw new DuplicateResourceException("This email is already in use.");
        }

        Optional<PendingRegistration> existing = pendingRepository.findById(subdomain).filter(this::isLive);
        if (existing.isPresent()) {
            if (!existing.get().getEmail().equals(email)) {
                throw new DuplicateResourceException(BEING_REGISTERED);
            }
            enforceCooldown(existing.get());
        }

        String code = newCode();
        Instant now = Instant.now();
        PendingRegistration pending = new PendingRegistration();
        pending.setSubdomain(subdomain);
        pending.setSchoolName(request.schoolName().trim());
        pending.setEmail(email);
        pending.setPasswordHash(passwordEncoder.encode(request.password()));
        pending.setCodeHash(passwordEncoder.encode(code));
        pending.setAttempts(0);
        pending.setLastSentAt(now);
        pending.setExpiresAt(now.plus(Duration.ofMinutes(CODE_MINUTES)));
        pendingRepository.save(pending);

        try {
            emailService.sendVerificationCode(email, pending.getSchoolName(), code);
        } catch (EmailDeliveryException e) {
            pendingRepository.deleteById(subdomain); // don't keep the address blocked for an email that never arrived
            throw e;
        }
        return response(pending);
    }

    /** Step 2: a right code creates the school and its admin together. */
    public RegistrationResponse verify(VerifyRegistrationRequest request) {
        String subdomain = SubdomainRules.normalize(request.subdomain());
        PendingRegistration pending = pendingRepository.findById(subdomain)
                .orElseThrow(() -> new InvalidRequestException(EXPIRED));

        if (!isLive(pending)) {
            pendingRepository.deleteById(subdomain);
            throw new InvalidRequestException(EXPIRED);
        }

        if (!passwordEncoder.matches(request.code(), pending.getCodeHash())) {
            pending.setAttempts(pending.getAttempts() + 1);
            if (pending.getAttempts() >= MAX_ATTEMPTS) {
                pendingRepository.deleteById(subdomain);
                throw new InvalidRequestException("Too many wrong codes. Please register again.");
            }
            pendingRepository.save(pending);
            int left = MAX_ATTEMPTS - pending.getAttempts();
            throw new InvalidRequestException("That code isn't right. " + left + (left == 1 ? " try" : " tries") + " left.");
        }

        Tenant tenant = new Tenant();
        tenant.setName(pending.getSchoolName());
        tenant.setSubdomain(pending.getSubdomain());
        Tenant saved = tenantService.createTenant(tenant);

        User admin = new User();
        admin.setTenantId(saved.getId());
        admin.setName("Admin");
        admin.setEmail(pending.getEmail());
        admin.setPassword(pending.getPasswordHash()); // already hashed
        admin.setRole(Role.ADMIN);

        try {
            userService.createUserHashed(admin);
        } catch (RuntimeException e) {
            // don't leave a school without an admin behind
            tenantService.deleteTenant(saved.getId());
            throw e;
        }

        pendingRepository.deleteById(subdomain);
        return new RegistrationResponse(saved.getSubdomain());
    }

    public PendingRegistrationResponse resend(ResendRequest request) {
        String subdomain = SubdomainRules.normalize(request.subdomain());
        PendingRegistration pending = pendingRepository.findById(subdomain)
                .filter(this::isLive)
                .orElseThrow(() -> new InvalidRequestException(EXPIRED));
        enforceCooldown(pending);

        String code = newCode();
        Instant now = Instant.now();
        pending.setCodeHash(passwordEncoder.encode(code));
        pending.setAttempts(0);
        pending.setLastSentAt(now);
        pending.setExpiresAt(now.plus(Duration.ofMinutes(CODE_MINUTES)));
        pendingRepository.save(pending);

        emailService.sendVerificationCode(pending.getEmail(), pending.getSchoolName(), code);
        return response(pending);
    }

    private boolean isLive(PendingRegistration pending) {
        return pending.getExpiresAt().isAfter(Instant.now());
    }

    private void enforceCooldown(PendingRegistration pending) {
        long wait = RESEND_SECONDS - Duration.between(pending.getLastSentAt(), Instant.now()).getSeconds();
        if (wait > 0) {
            throw new TooManyRequestsException("Please wait " + wait + " seconds before asking for another code.");
        }
    }

    private String newCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private PendingRegistrationResponse response(PendingRegistration pending) {
        return new PendingRegistrationResponse(pending.getEmail(), CODE_MINUTES * 60, RESEND_SECONDS);
    }
}