package com.nexuslms.engine.controller;

import com.nexuslms.engine.dto.AuthResponse;
import com.nexuslms.engine.dto.ForgotPasswordRequest;
import com.nexuslms.engine.dto.LoginRequest;
import com.nexuslms.engine.dto.ResetPasswordRequest;
import com.nexuslms.engine.dto.UserResponse;
import com.nexuslms.engine.exception.InvalidRequestException;
import com.nexuslms.engine.models.Tenant;
import com.nexuslms.engine.repository.TenantRepository;
import com.nexuslms.engine.security.AuthUser;
import com.nexuslms.engine.service.AuthService;
import com.nexuslms.engine.service.PasswordResetService;
import com.nexuslms.engine.service.SubdomainRules;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final TenantRepository tenantRepository;

    public AuthController(AuthService authService, PasswordResetService passwordResetService, TenantRepository tenantRepository) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
        this.tenantRepository = tenantRepository;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal AuthUser auth) {
        return authService.me(auth.userId());
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request,
                                               @RequestHeader("X-Tenant-Subdomain") String rawSubdomain) {
        String subdomain = SubdomainRules.normalize(rawSubdomain);
        Tenant tenant = tenantRepository.findBySubdomain(subdomain)
                .filter(Tenant::isActive)
                .orElseThrow(() -> new InvalidRequestException("School not found."));

        passwordResetService.requestReset(tenant.getId(), request.email());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.ok().build();
    }
}