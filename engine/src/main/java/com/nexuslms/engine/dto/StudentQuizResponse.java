package com.nexuslms.engine.dto;

import com.nexuslms.engine.models.Question;
import com.nexuslms.engine.models.Quiz;

import java.util.List;

// What a student sees when they open a quiz. Questions are stripped of their answers.
public record StudentQuizResponse(
        String id,
        String title,
        String description,
        Integer timeLimitMinutes,
        int totalMarks,
        String category,
        boolean resultsReleased,
        List<StudentQuestion> questions
) {
    public static StudentQuizResponse from(Quiz q) {
        return new StudentQuizResponse(
                q.getId(),
                q.getTitle(),
                q.getDescription(),
                q.getTimeLimitMinutes(),
                q.effectiveTotalMarks(),
                q.getCategory() == null ? null : q.getCategory().name(),
                q.isResultsReleased(),
                q.getQuestions().stream().map(StudentQuestion::from).toList()
        );
    }

    public record StudentQuestion(
            String text,
            String type,
            List<String> options,
            Integer marks
    ) {
        public static StudentQuestion from(Question q) {
            return new StudentQuestion(q.getText(), q.getType().name(), q.getOptions(), q.getMarks());
        }
    }
}