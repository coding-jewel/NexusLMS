package com.nexuslms.engine.dto;

public record StudentTopicResponse(
        String id,
        String title,
        String description,
        String className,
        String teacherName,
        long assignmentCount,
        long quizCount
) {}