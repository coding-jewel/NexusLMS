package com.nexuslms.engine.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Sent by a teacher or a student who is redeeming a code. The code itself decides which one it is.
public record JoinRequest(
        @NotBlank(message = "Enter the code your school gave you.")
        String code,

        @NotBlank(message = "Your name is required.")
        @Size(max = 100, message = "That name is too long.")
        String name,

        @NotBlank(message = "Email is required.")
        @Email(message = "Enter a valid email.")
        String email,

        @NotBlank(message = "Password is required.")
        @Size(min = 8, max = 100, message = "Password must be at least 8 characters.")
        String password
) {}