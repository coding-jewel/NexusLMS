package com.nexuslms.engine.controller;

import com.nexuslms.engine.dto.AuthResponse;
import com.nexuslms.engine.dto.LoginRequest;
import com.nexuslms.engine.dto.UserResponse;
import com.nexuslms.engine.security.AuthUser;
import com.nexuslms.engine.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal AuthUser auth) {
        return authService.me(auth.userId());
    }
}