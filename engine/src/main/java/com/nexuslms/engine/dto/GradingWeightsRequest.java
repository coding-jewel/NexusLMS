package com.nexuslms.engine.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record GradingWeightsRequest(
        @NotNull(message = "Enter all three weights.")
        @Min(value = 0, message = "Weights can't be below 0%.")
        @Max(value = 100, message = "Weights can't be above 100%.")
        Integer assignments,

        @NotNull(message = "Enter all three weights.")
        @Min(value = 0, message = "Weights can't be below 0%.")
        @Max(value = 100, message = "Weights can't be above 100%.")
        Integer tests,

        @NotNull(message = "Enter all three weights.")
        @Min(value = 0, message = "Weights can't be below 0%.")
        @Max(value = 100, message = "Weights can't be above 100%.")
        Integer exams
) {}