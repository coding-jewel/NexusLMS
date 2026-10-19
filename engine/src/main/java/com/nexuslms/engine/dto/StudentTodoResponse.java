package com.nexuslms.engine.dto;

import java.time.LocalDateTime;

// A unified view of everything a student still needs to do.
public record StudentTodoResponse(
        String id,           // assignmentId or quizId
        String kind,         // "ASSIGNMENT" | "QUIZ" | "TEST" | "EXAM"
        String title,
        String className,
        String topicName,    // null for TEST/EXAM
        String courseId,     // null for TEST/EXAM
        LocalDateTime dueDate, // null for quizzes
        boolean overdue
) {}