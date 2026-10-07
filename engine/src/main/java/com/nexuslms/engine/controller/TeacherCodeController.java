package com.nexuslms.engine.controller;

import com.nexuslms.engine.dto.TeacherCodeResponse;
import com.nexuslms.engine.security.AuthUser;
import com.nexuslms.engine.service.TeacherCodeService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/teacher-code")
public class TeacherCodeController {

    private final TeacherCodeService teacherCodeService;

    public TeacherCodeController(TeacherCodeService teacherCodeService) {
        this.teacherCodeService = teacherCodeService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public TeacherCodeResponse get(@AuthenticationPrincipal AuthUser auth) {
        return new TeacherCodeResponse(teacherCodeService.get(auth.tenantId()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/regenerate")
    public TeacherCodeResponse regenerate(@AuthenticationPrincipal AuthUser auth) {
        return new TeacherCodeResponse(teacherCodeService.regenerate(auth.tenantId()));
    }
}