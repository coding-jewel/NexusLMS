package com.nexuslms.engine.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

// What a student sends when they submit a quiz. studentId and tenantId come from the token.
// leftPage is the client-reported count of tab-aways; server stores it for the teacher to see.
public record QuizAttemptRequest(
        @NotBlank(message = "Quiz is required.")
        String quizId,

        @NotNull(message = "Answers are required.")
        Map<String, String> answers,

        Integer leftPage
) {}