package com.nexuslms.engine.dto;

import java.util.List;

public record TeacherStatsResponse(
        long classes,
        long courses,
        long assignments,
        List<ToGrade> toGrade
) {
    public record ToGrade(
            String kind,
            String courseId,
            String courseName,
            String itemId,
            String itemName,
            long count
    ) {}
}