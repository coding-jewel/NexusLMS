package com.nexuslms.engine.dto;

import java.util.List;
import java.util.Map;

// One DTO, two scopes.
// COURSE — assignments + quizzes, no weighted overall.
// CLASS  — tests + exams, with a weighted overall using the school's weights.
public record GradebookResponse(
        String scope,           // "COURSE" | "CLASS"
        String id,              // courseId or classId
        String name,            // course title or class name
        String className,       // always present for context
        List<Group> groups,
        List<Row> rows
) {
    public record Group(String key, String label, List<Item> items) {}

    public record Item(String id, String title, int totalMarks) {}

    public record Row(
            String studentId,
            String studentName,
            Map<String, Integer> scores,      // itemId -> score, only for graded items
            Map<String, Double> subtotals,    // groupKey -> percentage (0-100), null if none scored
            Double overall,                   // only set for CLASS scope
            boolean provisional               // only meaningful for CLASS scope
    ) {}
}