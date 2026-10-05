package com.nexuslms.engine.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "School address is required") String subdomain,
        @NotBlank(message = "Email is required") String email,
        @NotBlank(message = "Password is required") String password
) {}