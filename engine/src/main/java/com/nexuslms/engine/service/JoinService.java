package com.nexuslms.engine.service;

import com.nexuslms.engine.dto.JoinRequest;
import com.nexuslms.engine.dto.JoinResponse;
import com.nexuslms.engine.dto.PendingJoinResponse;
import com.nexuslms.engine.dto.ResendJoinRequest;
import com.nexuslms.engine.dto.UserResponse;
import com.nexuslms.engine.dto.VerifyJoinRequest;
import com.nexuslms.engine.exception.DuplicateResourceException;
import com.nexuslms.engine.exception.InvalidJoinCodeException;
import com.nexuslms.engine.exception.InvalidRequestException;
import com.nexuslms.engine.exception.TooManyRequestsException;
import com.nexuslms.engine.models.PendingJoin;
import com.nexuslms.engine.models.Role;
import com.nexuslms.engine.models.SchoolClass;
import com.nexuslms.engine.models.Tenant;
import com.nexuslms.engine.models.User;
import com.nexuslms.engine.repository.PendingJoinRepository;
import com.nexuslms.engine.repository.SchoolClassRepository;
import com.nexuslms.engine.repository.TenantRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

// One entry point. A STAFF- code makes a teacher who waits for admin approval;
// any other code is a class code and makes a student who is signed in straight away.
// A code sent by email verifies the address before anything real is created.
@Service
public class JoinService {
    static final int CODE_MINUTES = 15;
    static final int MAX_ATTEMPTS = 5;
    static final int RESEND_SECONDS = 60;
    private static final String EXPIRED = "This code has expired. Please start again.";
    private static final String BEING_JOINED = "This email is already being signed up. Try again in a few minutes.";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final TenantRepository tenantRepository;
    private final SchoolClassRepository classRepository;
    private final PendingJoinRepository pendingRepository;
    private final UserService userService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public JoinService(TenantRepository tenantRepository, SchoolClassRepository classRepository,
                       PendingJoinRepository pendingRepository, UserService userService,
                       JwtService jwtService, PasswordEncoder passwordEncoder, EmailService emailService) {
        this.tenantRepository = tenantRepository;
        this.classRepository = classRepository;
        this.pendingRepository = pendingRepository;
        this.userService = userService;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    /** Step 1: hold the details, email a code. Nothing real is created yet. */
    public PendingJoinResponse start(JoinRequest request) {
        String email = request.email().trim().toLowerCase();
        String code = request.code() == null ? "" : request.code().trim().toUpperCase();

        if (code.startsWith(TeacherCodes.PREFIX)) {
            return startTeacher(code, request, email);
        }
        return startStudent(code, request, email);
    }

    /** Step 2: a right code creates the account. Students are signed in; teachers wait for approval. */
    public JoinResponse verify(VerifyJoinRequest request) {
        String email = request.email().trim().toLowerCase();
        PendingJoin pending = findPendingByEmail(email)
                .orElseThrow(() -> new InvalidRequestException(EXPIRED));

        if (!isLive(pending)) {
            pendingRepository.deleteById(pending.getId());
            throw new InvalidRequestException(EXPIRED);
        }

        if (!passwordEncoder.matches(request.code(), pending.getCodeHash())) {
            pending.setAttempts(pending.getAttempts() + 1);
            if (pending.getAttempts() >= MAX_ATTEMPTS) {
                pendingRepository.deleteById(pending.getId());
                throw new InvalidRequestException("Too many wrong codes. Please start again.");
            }
            pendingRepository.save(pending);
            int left = MAX_ATTEMPTS - pending.getAttempts();
            throw new InvalidRequestException("That code isn't right. " + left + (left == 1 ? " try" : " tries") + " left.");
        }

        User user = new User();
        user.setTenantId(pending.getTenantId());
        user.setName(pending.getName());
        user.setEmail(pending.getEmail());
        user.setPassword(pending.getPasswordHash()); // already hashed
        user.setRole(pending.getRole());
        if (pending.getRole() == Role.STUDENT && pending.getClassId() != null) {
            user.setClassIds(List.of(pending.getClassId()));
        }
        user.setApproved(pending.getRole() == Role.STUDENT); // teachers wait for the admin

        User saved;
        try {
            saved = userService.createUserHashed(user);
        } catch (RuntimeException e) {
            // Leave the pending record alone so they can try a different email, but don't keep the code valid.
            pendingRepository.deleteById(pending.getId());
            throw e;
        }

        pendingRepository.deleteById(pending.getId());

        if (saved.getRole() == Role.STUDENT) {
            String token = jwtService.generateToken(
                    saved.getId(), saved.getEmail(), saved.getRole().name(), saved.getTenantId());
            return new JoinResponse(pending.getSubdomain(), UserResponse.from(saved), token);
        }
        // Teacher: no token on purpose, they can't sign in until the admin approves them.
        return new JoinResponse(pending.getSubdomain(), UserResponse.from(saved), null);
    }

    public PendingJoinResponse resend(ResendJoinRequest request) {
        String email = request.email().trim().toLowerCase();
        PendingJoin pending = findPendingByEmail(email)
                .filter(this::isLive)
                .orElseThrow(() -> new InvalidRequestException(EXPIRED));
        enforceCooldown(pending);

        String newCode = newCode();
        Instant now = Instant.now();
        pending.setCodeHash(passwordEncoder.encode(newCode));
        pending.setAttempts(0);
        pending.setLastSentAt(now);
        pending.setExpiresAt(now.plus(Duration.ofMinutes(CODE_MINUTES)));
        pendingRepository.save(pending);

        Tenant tenant = tenantRepository.findById(pending.getTenantId())
                .orElseThrow(() -> new InvalidRequestException(EXPIRED));
        emailService.sendVerificationCode(pending.getEmail(), tenant.getName(), newCode);
        return response(pending);
    }

    // --- teacher path ---

    private PendingJoinResponse startTeacher(String code, JoinRequest request, String email) {
        Tenant tenant = tenantRepository.findByTeacherCode(code)
                .filter(Tenant::isActive)
                .orElseThrow(() -> new InvalidJoinCodeException("Invalid code"));

        if (userService.getUserByEmailAndTenant(email, tenant.getId()).isPresent()) {
            throw new DuplicateResourceException("This email is already in use in this school.");
        }

        PendingJoin pending = buildPending(tenant, request, email, Role.TEACHER, null);
        return saveAndSend(pending, tenant);
    }

    // --- student path ---

    private PendingJoinResponse startStudent(String code, JoinRequest request, String email) {
        SchoolClass schoolClass = classRepository.findByCode(code)
                .orElseThrow(() -> new InvalidJoinCodeException("Invalid code"));

        Tenant tenant = tenantRepository.findById(schoolClass.getTenantId())
                .filter(Tenant::isActive)
                .orElseThrow(() -> new InvalidJoinCodeException("Invalid code"));

        if (userService.getUserByEmailAndTenant(email, tenant.getId()).isPresent()) {
            throw new DuplicateResourceException("This email is already in use in this school.");
        }

        PendingJoin pending = buildPending(tenant, request, email, Role.STUDENT, schoolClass.getId());
        return saveAndSend(pending, tenant);
    }

    // --- shared bits ---

    private PendingJoin buildPending(Tenant tenant, JoinRequest request, String email, Role role, String classId) {
        String id = tenant.getId() + ":" + email;

        // If a live pending record already exists for this person and school, refuse during cooldown
        // unless it's a completely different flow. A new code replaces an expired one.
        Optional<PendingJoin> existing = pendingRepository.findById(id).filter(this::isLive);
        if (existing.isPresent()) {
            enforceCooldown(existing.get());
        }

        PendingJoin pending = new PendingJoin();
        pending.setId(id);
        pending.setTenantId(tenant.getId());
        pending.setSubdomain(tenant.getSubdomain());
        pending.setName(request.name().trim());
        pending.setEmail(email);
        pending.setPasswordHash(passwordEncoder.encode(request.password()));
        pending.setRole(role);
        pending.setClassId(classId);
        pending.setAttempts(0);
        return pending;
    }

    private PendingJoinResponse saveAndSend(PendingJoin pending, Tenant tenant) {
        String code = newCode();
        Instant now = Instant.now();
        pending.setCodeHash(passwordEncoder.encode(code));
        pending.setLastSentAt(now);
        pending.setExpiresAt(now.plus(Duration.ofMinutes(CODE_MINUTES)));
        pendingRepository.save(pending);

        emailService.sendVerificationCode(pending.getEmail(), tenant.getName(), code);
        return response(pending);
    }

    private Optional<PendingJoin> findPendingByEmail(String email) {
        // The id is tenantId:email, but the caller knows only the email.
        // The tenant is implied by the caller's subdomain, so we scan — small collection, TTL keeps it bounded.
        return pendingRepository.findAll().stream()
                .filter(p -> p.getEmail().equals(email))
                .findFirst();
    }

    private boolean isLive(PendingJoin pending) {
        return pending.getExpiresAt() != null && pending.getExpiresAt().isAfter(Instant.now());
    }

    private void enforceCooldown(PendingJoin pending) {
        long wait = RESEND_SECONDS - Duration.between(pending.getLastSentAt(), Instant.now()).getSeconds();
        if (wait > 0) {
            throw new TooManyRequestsException("Please wait " + wait + " seconds before asking for another code.");
        }
    }

    private String newCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private PendingJoinResponse response(PendingJoin pending) {
        return new PendingJoinResponse(pending.getEmail(), pending.getRole(), CODE_MINUTES * 60, RESEND_SECONDS);
    }
}