package com.nexuslms.engine.service;

import com.nexuslms.engine.dto.AuthResponse;
import com.nexuslms.engine.dto.LoginRequest;
import com.nexuslms.engine.dto.UserResponse;
import com.nexuslms.engine.exception.InvalidRequestException;
import com.nexuslms.engine.models.Tenant;
import com.nexuslms.engine.models.User;
import com.nexuslms.engine.repository.TenantRepository;
import com.nexuslms.engine.repository.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private static final String INVALID = "Invalid email or password";

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(TenantRepository tenantRepository, UserRepository userRepository,
                       PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    // Every failure gives the same message, so nobody can tell which part was wrong.
    public AuthResponse login(LoginRequest request) {
        Tenant tenant = tenantRepository.findBySubdomain(SubdomainRules.normalize(request.subdomain()))
                .filter(Tenant::isActive)
                .orElseThrow(() -> new BadCredentialsException(INVALID));

        User user = userRepository
                .findByEmailAndTenantId(request.email().trim().toLowerCase(), tenant.getId())
                .filter(User::isActive)
                .orElseThrow(() -> new BadCredentialsException(INVALID));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadCredentialsException(INVALID);
        }
        // Only someone who knows the right password learns that their request is still waiting.
        if (!user.isApproved()) {
            throw new InvalidRequestException("Your account is waiting for approval from your school admin.");
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name(), user.getTenantId());
        return new AuthResponse(token, UserResponse.from(user));
    }

    /** Used to restore a session. A deleted or disabled user gets a 401, which sends them to /login. */
    public UserResponse me(String userId) {
        if (userId == null) {
            throw new BadCredentialsException("Session expired");
        }
        return userRepository.findById(userId)
                .filter(User::isActive)
                .filter(User::isApproved)
                .map(UserResponse::from)
                .orElseThrow(() -> new BadCredentialsException("Session expired"));
    }
}