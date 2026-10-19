package com.nexuslms.engine.dto;

import jakarta.validation.constraints.NotBlank;

public record JoinClassRequest(
        @NotBlank(message = "Enter a class code.")
        String code
) {}