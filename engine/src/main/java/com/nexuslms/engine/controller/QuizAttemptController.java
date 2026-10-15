package com.nexuslms.engine.controller;

import com.nexuslms.engine.dto.GradeAttemptRequest;
import com.nexuslms.engine.dto.QuizAttemptRequest;
import com.nexuslms.engine.models.QuizAttempt;
import com.nexuslms.engine.security.AuthUser;
import com.nexuslms.engine.service.QuizAttemptService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quiz-attempts")
public class QuizAttemptController {

    private final QuizAttemptService quizAttemptService;

    public QuizAttemptController(QuizAttemptService quizAttemptService) {
        this.quizAttemptService = quizAttemptService;
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping
    public ResponseEntity<QuizAttempt> submitAttempt(@Valid @RequestBody QuizAttemptRequest request,
                                                     @AuthenticationPrincipal AuthUser auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quizAttemptService.submitAttempt(auth, request));
    }

    @PreAuthorize("hasRole('TEACHER')")
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

    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/quiz/{quizId}/ungraded")
    public ResponseEntity<List<QuizAttempt>> getUngradedAttempts(@PathVariable String quizId) {
        return ResponseEntity.ok(quizAttemptService.getUngradedAttempts(quizId));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PatchMapping("/{id}/grade")
    public ResponseEntity<QuizAttempt> gradeAttempt(@PathVariable String id,
                                                    @Valid @RequestBody GradeAttemptRequest request,
                                                    @AuthenticationPrincipal AuthUser auth) {
        return ResponseEntity.ok(quizAttemptService.gradeAttempt(auth, id, request));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttempt(@PathVariable String id) {
        quizAttemptService.deleteAttempt(id);
        return ResponseEntity.noContent().build();
    }
}