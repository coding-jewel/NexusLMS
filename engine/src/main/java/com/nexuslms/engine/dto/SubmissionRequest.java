package com.nexuslms.engine.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// What a student sends to hand in an assignment. studentId and tenantId come from the token.
public record SubmissionRequest(
        @NotBlank(message = "Assignment is required.")
        String assignmentId,

        @Size(max = 5000, message = "That note is too long.")
        String text
) {}