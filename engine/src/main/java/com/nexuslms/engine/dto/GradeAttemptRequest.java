package com.nexuslms.engine.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

// additionalScore is what the teacher adds for the open-ended answers on top of the auto-marked MCQ score.
public record GradeAttemptRequest(
        @NotNull(message = "Score is required.")
        @Min(value = 0, message = "Score can't be negative.")
        Integer additionalScore
) {}