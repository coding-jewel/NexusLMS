package com.nexuslms.engine.controller;

import com.nexuslms.engine.models.Grade;
import com.nexuslms.engine.service.GradeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grades")
public class GradeController {

    private final GradeService gradeService;

    public GradeController(GradeService gradeService) {
        this.gradeService = gradeService;
    }

    @PostMapping
    public ResponseEntity<Grade> createGrade(@Valid @RequestBody Grade grade) {
        Grade created = gradeService.createGrade(grade);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/student/{studentId}/course/{courseId}")
    public ResponseEntity<List<Grade>> getGradesByStudentAndCourse(
            @PathVariable String studentId,
            @PathVariable String courseId) {
        return ResponseEntity.ok(gradeService.getGradesByStudentAndCourse(studentId, courseId));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Grade>> getGradesByStudent(@PathVariable String studentId) {
        return ResponseEntity.ok(gradeService.getGradesByStudent(studentId));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<Grade>> getGradesByCourse(@PathVariable String courseId) {
        return ResponseEntity.ok(gradeService.getGradesByCourse(courseId));
    }

    @GetMapping("/assignment/{assignmentId}/student/{studentId}")
    public ResponseEntity<Grade> getGradeByAssignmentAndStudent(
            @PathVariable String assignmentId,
            @PathVariable String studentId) {
        return gradeService.getGradeByAssignmentAndStudent(assignmentId, studentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/quiz/{quizId}/student/{studentId}")
    public ResponseEntity<Grade> getGradeByQuizAndStudent(
            @PathVariable String quizId,
            @PathVariable String studentId) {
        return gradeService.getGradeByQuizAndStudent(quizId, studentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Grade> getGradeById(@PathVariable String id) {
        return gradeService.getGradeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGrade(@PathVariable String id) {
        gradeService.deleteGrade(id);
        return ResponseEntity.noContent().build();
    }
}