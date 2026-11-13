package com.nexuslms.engine.dto;

import com.nexuslms.engine.models.SchoolClass;

import java.time.LocalDateTime;
import java.util.List;

public record ClassResponse(
        String id,
        String name,
        String description,
        String code,
        LocalDateTime createdAt,
        List<String> teacherIds,
        long studentCount,
        // NEW: Added the grading fields
        String gradingMethod,
        int assignmentWeight,
        int quizWeight,
        int examWeight
) {
    public static ClassResponse from(SchoolClass c, List<String> teacherIds, long studentCount) {
        return new ClassResponse(
                c.getId(), c.getName(), c.getDescription(), c.getCode(),
                c.getCreatedAt(), teacherIds, studentCount,
                c.getGradingMethod(), c.getAssignmentWeight(), c.getQuizWeight(), c.getExamWeight()
        );
    }
}