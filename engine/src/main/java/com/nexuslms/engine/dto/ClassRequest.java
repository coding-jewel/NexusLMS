package com.nexuslms.engine.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClassRequest(
        @NotBlank(message = "Class name is required")
        @Size(max = 60, message = "Class name is too long")
        String name,

        @Size(max = 200, message = "Description is too long")
        String description
) {}