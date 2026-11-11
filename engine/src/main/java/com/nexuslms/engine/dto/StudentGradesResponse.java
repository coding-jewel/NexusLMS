package com.nexuslms.engine.dto;

import java.util.List;

public record StudentGradesResponse(
        List<ClassSummary> classes,
        List<CourseGrades> courses,
        List<ClassResult> testsAndExams
) {
    public record ClassSummary(
            String classId,
            String className,
            Double assignmentPct,
            Double quizPct,
            Double examPct,
            Double overall,
            String gradingMethod, // "RAW" or "WEIGHTED"
            int assignmentWeight,
            int quizWeight,
            int examWeight
    ) {}

    public record CourseGrades(
            String courseId,
            String courseName,
            String className,
            List<GradeItem> items
    ) {}

    public record GradeItem(
            String itemId,
            String title,
            String kind,            // "ASSIGNMENT" | "QUIZ"
            Integer score,
            Integer totalMarks,
            String feedback
    ) {}

    public record ClassResult(
            String quizId,
            String title,
            String className,
            String category,        // "EXAM"
            boolean released,
            Integer score,          // null until released
            Integer totalMarks
    ) {}
}