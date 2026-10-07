package com.nexuslms.engine.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyJoinRequest(
        @NotBlank(message = "Email is required.")
        @Email(message = "Enter a valid email.")
        String email,

        @NotBlank(message = "Enter the 6-digit code.")
        @Pattern(regexp = "\\d{6}", message = "Enter the 6-digit code.")
        String code
) {}