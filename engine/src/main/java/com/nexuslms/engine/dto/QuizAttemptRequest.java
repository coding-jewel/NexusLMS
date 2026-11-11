package com.nexuslms.engine.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record QuizAttemptRequest(
        @NotBlank(message = "Quiz is required.")
        String quizId,

        @NotNull(message = "Answers are required.")
        Map<String, String> answers

) {}