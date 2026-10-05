package com.nexuslms.engine.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterSchoolRequest(
        @NotBlank(message = "School name is required")
        @Size(max = 100, message = "School name is too long")
        String schoolName,

        @NotBlank(message = "Address is required")
        String subdomain,

        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
        String password
) {}