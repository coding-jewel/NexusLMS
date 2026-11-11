package com.nexuslms.engine.controller;

import com.nexuslms.engine.dto.GradeAttemptRequest;
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
import java.util.Map;

@RestController
@RequestMapping("/api/quiz-attempts")
public class QuizAttemptController {

    private final QuizAttemptService quizAttemptService;

    public QuizAttemptController(QuizAttemptService quizAttemptService) {
        this.quizAttemptService = quizAttemptService;
    }

    public record SubmitAnswersRequest(Map<String, String> answers) {}

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/start")
    public ResponseEntity<QuizAttempt> start(@RequestBody Map<String, String> body,
                                             @AuthenticationPrincipal AuthUser auth) {
        String quizId = body.get("quizId");
        if (quizId == null || quizId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(quizAttemptService.startAttempt(auth, quizId));
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/{id}/submit")
    public ResponseEntity<QuizAttempt> submit(@PathVariable String id,
                                              @RequestBody SubmitAnswersRequest request,
                                              @AuthenticationPrincipal AuthUser auth) {
        return ResponseEntity.ok(quizAttemptService.submitAttempt(auth, id, request.answers()));
    }

    // NEW: Endpoint to abandon an attempt when the student closes the tab
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/{id}/abandon")
    public ResponseEntity<Void> abandon(@PathVariable String id, @AuthenticationPrincipal AuthUser auth) {
        quizAttemptService.abandonAttempt(auth, id);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/mine")
    public ResponseEntity<List<QuizAttempt>> getMyAttempts(@AuthenticationPrincipal AuthUser auth) {
        return ResponseEntity.ok(quizAttemptService.getAllAttemptsByStudent(auth.userId()));
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/quiz/{quizId}/mine")
    public ResponseEntity<QuizAttempt> myAttempt(@PathVariable String quizId,
                                                 @AuthenticationPrincipal AuthUser auth) {
        return quizAttemptService.myAttemptFor(auth, quizId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
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