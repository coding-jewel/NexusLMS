package com.nexuslms.engine.controller;

import com.nexuslms.engine.dto.GradebookResponse;
import com.nexuslms.engine.security.AuthUser;
import com.nexuslms.engine.service.GradebookService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/gradebook")
public class GradebookController {

    private final GradebookService gradebookService;

    public GradebookController(GradebookService gradebookService) {
        this.gradebookService = gradebookService;
    }

    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/course/{courseId}")
    public GradebookResponse forCourse(@PathVariable String courseId, @AuthenticationPrincipal AuthUser auth) {
        return gradebookService.forCourse(auth, courseId);
    }

    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @GetMapping("/class/{classId}")
    public GradebookResponse forClass(@PathVariable String classId, @AuthenticationPrincipal AuthUser auth) {
        return gradebookService.forClass(auth, classId);
    }
}