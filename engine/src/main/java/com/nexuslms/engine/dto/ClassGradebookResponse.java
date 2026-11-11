package com.nexuslms.engine.dto;

import java.util.List;

public record ClassGradebookResponse(
        List<StudentRow> rows,
        String gradingMethod // "RAW" or "WEIGHTED"
) {
    public record StudentRow(
            String studentId,
            String studentName,
            Double assignmentPct, // Average across all assignments
            Double quizPct,       // Average across all topic quizzes
            Double examPct,       // Average across all class exams
            Double overall        // Final raw or weighted grade
    ) {}
}