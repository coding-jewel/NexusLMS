package com.nexuslms.engine.dto;

import jakarta.validation.constraints.NotNull;

// additionalScore can be negative if a teacher is lowering an existing grade.
public record GradeAttemptRequest(
        @NotNull(message = "Score is required.")
        Integer additionalScore
) {}