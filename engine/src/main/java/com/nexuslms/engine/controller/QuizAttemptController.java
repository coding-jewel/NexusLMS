package com.nexuslms.engine.controller;

import com.nexuslms.engine.models.QuizAttempt;
import com.nexuslms.engine.service.QuizAttemptService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quiz-attempts")
public class QuizAttemptController {

    private final QuizAttemptService quizAttemptService;

    public QuizAttemptController(QuizAttemptService quizAttemptService) {
        this.quizAttemptService = quizAttemptService;
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping
    public ResponseEntity<QuizAttempt> submitAttempt(@Valid @RequestBody QuizAttempt attempt) {
        QuizAttempt submitted = quizAttemptService.submitAttempt(attempt);
        return ResponseEntity.status(HttpStatus.CREATED).body(submitted);
    }

    @GetMapping("/quiz/{quizId}")
    public ResponseEntity<List<QuizAttempt>> getAllAttemptsByQuiz(@PathVariable String quizId) {
        return ResponseEntity.ok(quizAttemptService.getAllAttemptsByQuiz(quizId));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<QuizAttempt>> getAllAttemptsByStudent(@PathVariable String studentId) {
        return ResponseEntity.ok(quizAttemptService.getAllAttemptsByStudent(studentId));
    }

    @GetMapping("/quiz/{quizId}/student/{studentId}")
    public ResponseEntity<QuizAttempt> getAttemptByQuizAndStudent(
            @PathVariable String quizId,
            @PathVariable String studentId) {
        return quizAttemptService.getAttemptByQuizAndStudent(quizId, studentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuizAttempt> getAttemptById(@PathVariable String id) {
        return quizAttemptService.getAttemptById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/quiz/{quizId}/ungraded")
    public ResponseEntity<List<QuizAttempt>> getUngradedAttempts(@PathVariable String quizId) {
        return ResponseEntity.ok(quizAttemptService.getUngradedAttempts(quizId));
    }

    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    @PatchMapping("/{id}/grade")
    public ResponseEntity<QuizAttempt> gradeAttempt(
            @PathVariable String id,
            @RequestBody Map<String, Integer> gradeData) {
        Integer additionalScore = gradeData.get("additionalScore");
        QuizAttempt graded = quizAttemptService.gradeAttempt(id, additionalScore);
        return ResponseEntity.ok(graded);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttempt(@PathVariable String id) {
        quizAttemptService.deleteAttempt(id);
        return ResponseEntity.noContent().build();
    }
}