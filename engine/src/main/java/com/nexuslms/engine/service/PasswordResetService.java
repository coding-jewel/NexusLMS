package com.nexuslms.engine.service;

import com.nexuslms.engine.exception.InvalidRequestException;
import com.nexuslms.engine.models.PasswordResetToken;
import com.nexuslms.engine.models.Tenant;
import com.nexuslms.engine.models.User;
import com.nexuslms.engine.repository.PasswordResetTokenRepository;
import com.nexuslms.engine.repository.TenantRepository;
import com.nexuslms.engine.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value; // <-- Added Import
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
public class PasswordResetService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    // FIXED: Read from application.properties / .env. Fallback to localhost:5173 for local dev.
    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public PasswordResetService(UserRepository userRepository, TenantRepository tenantRepository,
                                PasswordResetTokenRepository tokenRepository, EmailService emailService,
                                PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.tenantRepository = tenantRepository;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    public void requestReset(String tenantId, String email) {
        Optional<User> userOpt = userRepository.findByEmailAndTenantId(email.trim().toLowerCase(), tenantId);
        if (userOpt.isEmpty()) return;
        User user = userOpt.get();

        Tenant tenant = tenantRepository.findById(tenantId).orElseThrow();

        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUserId(user.getId());
        resetToken.setExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES));
        tokenRepository.save(resetToken);

        // FIXED: Dynamically insert the subdomain into the base URL
        // If frontendUrl is "http://localhost:5173", this becomes "http://nexus.localhost:5173"
        // If frontendUrl is "http://localhost", this becomes "http://nexus.localhost"
        String baseUrl = frontendUrl.replace("://", "://" + tenant.getSubdomain() + ".");
        String resetUrl = baseUrl + "/reset-password?token=" + token;
        
        emailService.sendPasswordResetLink(user.getEmail(), tenant.getName(), resetUrl);
    }

    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findById(token)
                .orElseThrow(() -> new InvalidRequestException("This reset link is invalid or has expired."));

        if (resetToken.getExpiresAt().isBefore(Instant.now())) {
            tokenRepository.delete(resetToken);
            throw new InvalidRequestException("This reset link has expired.");
        }

        User user = userRepository.findById(resetToken.getUserId())
                .orElseThrow(() -> new InvalidRequestException("User no longer exists."));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        tokenRepository.delete(resetToken);
    }
}