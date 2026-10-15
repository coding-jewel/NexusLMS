package com.nexuslms.engine.controller;

import com.nexuslms.engine.dto.StudentGradesResponse;
import com.nexuslms.engine.dto.StudentTopicResponse;
import com.nexuslms.engine.security.AuthUser;
import com.nexuslms.engine.service.StudentService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/student")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/topics")
    public List<StudentTopicResponse> topics(@AuthenticationPrincipal AuthUser auth) {
        return studentService.myTopics(auth);
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/grades")
    public StudentGradesResponse grades(@AuthenticationPrincipal AuthUser auth) {
        return studentService.myGrades(auth);
    }
}