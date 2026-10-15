package com.nexuslms.engine.controller;

import com.nexuslms.engine.dto.AssignTeacherRequest;
import com.nexuslms.engine.dto.ClassRequest;
import com.nexuslms.engine.dto.ClassResponse;
import com.nexuslms.engine.dto.UserResponse;
import com.nexuslms.engine.security.AuthUser;
import com.nexuslms.engine.service.SchoolClassService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
public class SchoolClassController {

    private final SchoolClassService schoolClassService;

    public SchoolClassController(SchoolClassService schoolClassService) {
        this.schoolClassService = schoolClassService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ClassResponse> create(@Valid @RequestBody ClassRequest request, @AuthenticationPrincipal AuthUser auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(schoolClassService.create(auth.tenantId(), request));
    }

    // Teachers can see their school's classes too, because they share class codes with students.
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping
    public List<ClassResponse> list(@AuthenticationPrincipal AuthUser auth) {
        return schoolClassService.list(auth.tenantId());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/regenerate-code")
    public ClassResponse regenerateCode(@PathVariable String id, @AuthenticationPrincipal AuthUser auth) {
        return schoolClassService.regenerateCode(auth.tenantId(), id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, @AuthenticationPrincipal AuthUser auth) {
        schoolClassService.delete(auth.tenantId(), id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/teachers")
    public ClassResponse assignTeacher(@PathVariable String id,
                                       @Valid @RequestBody AssignTeacherRequest request,
                                       @AuthenticationPrincipal AuthUser auth) {
        return schoolClassService.assignTeacher(auth.tenantId(), id, request.teacherId());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}/teachers/{teacherId}")
    public ClassResponse removeTeacher(@PathVariable String id,
                                       @PathVariable String teacherId,
                                       @AuthenticationPrincipal AuthUser auth) {
        return schoolClassService.removeTeacher(auth.tenantId(), id, teacherId);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping("/{id}/students")
    public List<UserResponse> students(@PathVariable String id, @AuthenticationPrincipal AuthUser auth) {
        return schoolClassService.students(auth.tenantId(), id, auth);
    }
}