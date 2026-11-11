package com.nexuslms.engine.dto;

import com.nexuslms.engine.models.Question;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record QuizUpdateRequest(
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

        @NotNull(message = "Questions are required.")
        List<Question> questions
) {}