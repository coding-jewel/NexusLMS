package com.nexuslms.engine.dto;

import com.nexuslms.engine.models.Course;

import java.time.LocalDateTime;

public record CourseResponse(
        String id,
        String classId,
        String className,
        String teacherId,
        String teacherName,
        String title,
        String description,
        boolean published,
        LocalDateTime createdAt
) {
    public static CourseResponse from(Course c, String className, String teacherName) {
        return new CourseResponse(c.getId(), c.getClassId(), className, c.getTeacherId(), teacherName,
                c.getTitle(), c.getDescription(), c.isPublished(), c.getCreatedAt());
    }
}