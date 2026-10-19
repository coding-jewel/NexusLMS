package com.nexuslms.engine.controller;

import com.nexuslms.engine.dto.JoinClassRequest;
import com.nexuslms.engine.dto.StudentAssessmentResponse;
import com.nexuslms.engine.dto.StudentClassResponse;
import com.nexuslms.engine.dto.StudentGradesResponse;
import com.nexuslms.engine.dto.StudentTodoResponse;
import com.nexuslms.engine.dto.StudentTopicResponse;
import com.nexuslms.engine.security.AuthUser;
import com.nexuslms.engine.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/join")
    public ResponseEntity<Void> joinClass(@Valid @RequestBody JoinClassRequest request,
                                          @AuthenticationPrincipal AuthUser auth) {
        studentService.joinClass(auth, request.code());
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/todo")
    public List<StudentTodoResponse> todo(@AuthenticationPrincipal AuthUser auth) {
        return studentService.myTodo(auth);
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/classes")
    public List<StudentClassResponse> classes(@AuthenticationPrincipal AuthUser auth) {
        return studentService.myClasses(auth);
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/topics")
    public List<StudentTopicResponse> topics(@AuthenticationPrincipal AuthUser auth) {
        return studentService.myTopics(auth);
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/assessments")
    public List<StudentAssessmentResponse> assessments(@AuthenticationPrincipal AuthUser auth) {
        return studentService.myAssessments(auth);
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/grades")
    public StudentGradesResponse grades(@AuthenticationPrincipal AuthUser auth) {
        return studentService.myGrades(auth);
    }
}