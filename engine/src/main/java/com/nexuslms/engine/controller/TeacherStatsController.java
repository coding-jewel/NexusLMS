package com.nexuslms.engine.controller;

import com.nexuslms.engine.dto.TeacherStatsResponse;
import com.nexuslms.engine.security.AuthUser;
import com.nexuslms.engine.service.TeacherStatsService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/teacher/stats")
public class TeacherStatsController {

    private final TeacherStatsService service;

    public TeacherStatsController(TeacherStatsService service) {
        this.service = service;
    }

    // The teacher always comes from the token.
    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping
    public TeacherStatsResponse stats(@AuthenticationPrincipal AuthUser auth) {
        return service.forTeacher(auth.tenantId(), auth.userId());
    }
}