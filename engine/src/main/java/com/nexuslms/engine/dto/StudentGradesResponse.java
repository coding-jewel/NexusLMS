package com.nexuslms.engine.dto;

import java.util.List;

// What a student sees on "My grades".
// Assignments and topic quizzes live under their course.
// Class tests and exams are grouped separately and only show a score if results were released.
public record StudentGradesResponse(
        List<CourseGrades> courses,
        List<ClassResult> testsAndExams
) {
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
            String category,        // "TEST" | "EXAM"
            boolean released,
            Integer score,          // null until released
            Integer totalMarks
    ) {}
}