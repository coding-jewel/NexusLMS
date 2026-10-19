package com.nexuslms.engine.dto;

// What a student sees on their Tests & Exams list. No questions, just the summary.
public record StudentAssessmentResponse(
        String quizId,
        String title,
        String className,
        String category, // "TEST" | "EXAM"
        Integer timeLimitMinutes,
        int totalMarks,
        boolean attempted,
        boolean resultsReleased
) {}