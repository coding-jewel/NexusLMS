package com.nexuslms.engine.controller;

import com.nexuslms.engine.dto.QuizRequest;
import com.nexuslms.engine.dto.QuizUpdateRequest;
import com.nexuslms.engine.models.Quiz;
import com.nexuslms.engine.security.AuthUser;
import com.nexuslms.engine.service.CloudinaryService;
import com.nexuslms.engine.service.QuizService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    private final QuizService quizService;
    private final CloudinaryService cloudinaryService;

    public QuizController(QuizService quizService, CloudinaryService cloudinaryService) {
        this.quizService = quizService;
        this.cloudinaryService = cloudinaryService;
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping
    public ResponseEntity<Quiz> create(@Valid @RequestBody QuizRequest request,
                                       @AuthenticationPrincipal AuthUser auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quizService.create(auth, request));
    }

    // --- topic-level quizzes ---

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<Quiz>> quizzesByCourse(@PathVariable String courseId) {
        return ResponseEntity.ok(quizService.getQuizzesByCourse(courseId));
    }

    @GetMapping("/course/{courseId}/published")
    public ResponseEntity<List<Quiz>> publishedQuizzesByCourse(@PathVariable String courseId) {
        return ResponseEntity.ok(quizService.getPublishedQuizzesByCourse(courseId));
    }

    // --- class-level tests and exams ---

    @GetMapping("/class/{classId}/tests")
    public ResponseEntity<List<Quiz>> testsByClass(@PathVariable String classId) {
        return ResponseEntity.ok(quizService.getTestsByClass(classId));
    }

    @GetMapping("/class/{classId}/exams")
    public ResponseEntity<List<Quiz>> examsByClass(@PathVariable String classId) {
        return ResponseEntity.ok(quizService.getExamsByClass(classId));
    }

    @GetMapping("/class/{classId}/tests/published")
    public ResponseEntity<List<Quiz>> publishedTestsByClass(@PathVariable String classId) {
        return ResponseEntity.ok(quizService.getPublishedTestsByClass(classId));
    }

    @GetMapping("/class/{classId}/exams/published")
    public ResponseEntity<List<Quiz>> publishedExamsByClass(@PathVariable String classId) {
        return ResponseEntity.ok(quizService.getPublishedExamsByClass(classId));
    }

    // --- teacher's combined list ---

    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/mine")
    public ResponseEntity<List<Quiz>> mine(@AuthenticationPrincipal AuthUser auth) {
        return ResponseEntity.ok(quizService.getTestsAndExamsByTeacher(auth.userId()));
    }

    // --- shared ---

    @GetMapping("/{id}")
    public ResponseEntity<Quiz> getQuizById(@PathVariable String id) {
        return quizService.getQuizById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Replaces title, description, time limit, and the full question list.
    @PreAuthorize("hasRole('TEACHER')")
    @PutMapping("/{id}")
    public ResponseEntity<Quiz> update(@PathVariable String id,
                                       @Valid @RequestBody QuizUpdateRequest request,
                                       @AuthenticationPrincipal AuthUser auth) {
        return ResponseEntity.ok(quizService.update(auth, id, request));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PatchMapping("/{id}/publish")
    public ResponseEntity<Quiz> publishQuiz(@PathVariable String id, @AuthenticationPrincipal AuthUser auth) {
        return ResponseEntity.ok(quizService.publishQuiz(auth, id));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PatchMapping("/{id}/release")
    public ResponseEntity<Quiz> release(@PathVariable String id,
                                        @RequestBody Map<String, Boolean> body,
                                        @AuthenticationPrincipal AuthUser auth) {
        boolean released = Boolean.TRUE.equals(body.get("released"));
        return ResponseEntity.ok(quizService.setReleased(auth, id, released));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping("/{id}/attachments")
    public ResponseEntity<Quiz> addAttachment(@PathVariable String id,
                                              @RequestParam("file") MultipartFile file,
                                              @AuthenticationPrincipal AuthUser auth) {
        try {
            String fileUrl = cloudinaryService.uploadFile(file, "quizzes");
            return ResponseEntity.ok(quizService.addAttachment(auth, id, fileUrl));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable String id, @AuthenticationPrincipal AuthUser auth) {
        quizService.deleteQuiz(auth, id);
        return ResponseEntity.noContent().build();
    }
}