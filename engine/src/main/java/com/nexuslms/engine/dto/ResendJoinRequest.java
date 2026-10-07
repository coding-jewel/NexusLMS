package com.nexuslms.engine.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ResendJoinRequest(
        @NotBlank(message = "Email is required.")
        @Email(message = "Enter a valid email.")
        String email
) {}