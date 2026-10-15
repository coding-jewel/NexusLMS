package com.nexuslms.engine.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record AssignmentRequest(
        @NotBlank(message = "Course is required.")
        String courseId,

        @NotBlank(message = "Title is required.")
        @Size(max = 200, message = "Title is too long.")
        String title,

        @Size(max = 2000, message = "Description is too long.")
        String description,

        @NotNull(message = "Due date is required.")
        @FutureOrPresent(message = "Due date can't be in the past.")
        LocalDateTime dueDate,

        @NotNull(message = "Total marks are required.")
        @Min(value = 1, message = "Total marks must be at least 1.")
        @Max(value = 1000, message = "Total marks can't exceed 1000.")
        Integer totalMarks
) {}