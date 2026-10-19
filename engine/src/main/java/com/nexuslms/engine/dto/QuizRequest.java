package com.nexuslms.engine.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record QuizRequest(
        @NotBlank(message = "Category is required.")
        String category,

        String courseId,

        String classId,

        @NotBlank(message = "Title is required.")
        @Size(max = 200, message = "Title is too long.")
        String title,

        @Size(max = 2000, message = "Description is too long.")
        String description,

        @Min(value = 1, message = "Time limit must be at least 1 minute.")
        Integer timeLimitMinutes,

        @NotNull(message = "Total marks are required.")
        @Min(value = 1, message = "Total marks must be at least 1.")
        @Max(value = 1000, message = "Total marks can't exceed 1000.")
        Integer totalMarks,

        // "OFF" | "RECORD" | "AUTO". Null defaults to RECORD.
        String guardMode,

        // 1–10. Null defaults to 3.
        Integer guardLimit
) {}