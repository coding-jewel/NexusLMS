package com.nexuslms.engine.controller;

import com.nexuslms.engine.models.Question;
import com.nexuslms.engine.models.Quiz;
import com.nexuslms.engine.service.CloudinaryService;
import com.nexuslms.engine.service.QuizService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    private final QuizService quizService;
    private final CloudinaryService cloudinaryService;

    public QuizController(QuizService quizService, CloudinaryService cloudinaryService) {
        this.quizService = quizService;
        this.cloudinaryService = cloudinaryService;
    }

    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Quiz> createQuiz(@Valid @RequestBody Quiz quiz) {
        Quiz created = quizService.createQuiz(quiz);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<Quiz>> getAllQuizzesByCourse(@PathVariable String courseId) {
        return ResponseEntity.ok(quizService.getAllQuizzesByCourse(courseId));
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<Quiz>> getAllQuizzesByTenant(@PathVariable String tenantId) {
        return ResponseEntity.ok(quizService.getAllQuizzesByTenant(tenantId));
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<Quiz>> getAllQuizzesByTeacher(@PathVariable String teacherId) {
        return ResponseEntity.ok(quizService.getAllQuizzesByTeacher(teacherId));
    }

    @GetMapping("/course/{courseId}/published")
    public ResponseEntity<List<Quiz>> getPublishedQuizzesByCourse(@PathVariable String courseId) {
        return ResponseEntity.ok(quizService.getPublishedQuizzesByCourse(courseId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Quiz> getQuizById(@PathVariable String id) {
        return quizService.getQuizById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    @PostMapping("/{id}/questions")
    public ResponseEntity<Quiz> addQuestion(
            @PathVariable String id,
            @Valid @RequestBody Question question) {
        Quiz updated = quizService.addQuestion(id, question);
        return ResponseEntity.ok(updated);
    }

    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    @PatchMapping("/{id}/publish")
    public ResponseEntity<Quiz> publishQuiz(@PathVariable String id) {
        Quiz published = quizService.publishQuiz(id);
        return ResponseEntity.ok(published);
    }

    @PostMapping("/{id}/attachments")
    public ResponseEntity<Quiz> addAttachment(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file) {
        try {
            String fileUrl = cloudinaryService.uploadFile(file, "quizzes");
            Quiz updated = quizService.addAttachment(id, fileUrl);
            return ResponseEntity.ok(updated);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable String id) {
        quizService.deleteQuiz(id);
        return ResponseEntity.noContent().build();
    }
}