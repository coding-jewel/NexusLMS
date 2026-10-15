package com.nexuslms.engine.dto;

import jakarta.validation.constraints.NotBlank;

public record AssignTeacherRequest(
        @NotBlank(message = "Choose a teacher.")
        String teacherId
) {}