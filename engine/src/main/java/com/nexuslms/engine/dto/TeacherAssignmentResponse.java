package com.nexuslms.engine.dto;

import java.time.LocalDateTime;

// One row on the teacher's Assignments page, enriched with the course, class and counts
// so the frontend doesn't have to do N+1 calls.
public record TeacherAssignmentResponse(
        String id,
        String title,
        String courseId,
        String courseName,
        String className,
        LocalDateTime dueDate,
        long submittedCount,
        long totalStudents,
        long toGradeCount
) {}