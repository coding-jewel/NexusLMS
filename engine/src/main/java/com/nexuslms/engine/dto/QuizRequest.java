package com.nexuslms.engine.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
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

        // "OFF" | "RECORD" | "AUTO". Null defaults to RECORD.
        String guardMode,

        // 1–10. Null defaults to 3.
        Integer guardLimit
) {}