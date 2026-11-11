package com.nexuslms.engine.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

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
        @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters.")
        @Pattern(
                regexp = "^(?=.*[a-zA-Z])(?=.*\\d)(?=.*[^a-zA-Z0-9]).{8,100}$",
                message = "Password must include at least one letter, one number, and one special character."
        )
        String password
) {}