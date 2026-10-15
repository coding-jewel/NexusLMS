package com.nexuslms.engine.dto;

import java.util.List;

// The numbers on the teacher's Overview page, plus a short list of items with work waiting.
public record TeacherStatsResponse(
        long classes,
        long courses,
        long assignments,
        long quizzes,
        List<ToGrade> toGrade
) {
    public record ToGrade(
            String kind,       // "assignment" | "quiz"
            String courseId,
            String courseName,
            String itemId,
            String itemName,
            long count
    ) {}
}