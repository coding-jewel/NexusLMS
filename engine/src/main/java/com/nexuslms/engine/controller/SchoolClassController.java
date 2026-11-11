package com.nexuslms.engine.controller;

import com.nexuslms.engine.dto.*;
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

    // Request payload for updating grading settings
    public record GradingSettingsRequest(String gradingMethod, int assignmentWeight, int quizWeight, int examWeight) {}

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ClassResponse> create(@Valid @RequestBody ClassRequest request, @AuthenticationPrincipal AuthUser auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(schoolClassService.create(auth.tenantId(), request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ClassResponse update(@PathVariable String id, @Valid @RequestBody ClassRequest request, @AuthenticationPrincipal AuthUser auth) {
        return schoolClassService.update(auth.tenantId(), id, request);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping
    public List<ClassResponse> list(@AuthenticationPrincipal AuthUser auth) {
        return schoolClassService.list(auth.tenantId());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT')")
    @GetMapping("/{id}")
    public ClassResponse getClass(@PathVariable String id, @AuthenticationPrincipal AuthUser auth) {
        return schoolClassService.getClass(auth.tenantId(), id, auth);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT')")
    @GetMapping("/{id}/people")
    public ClassPeopleResponse getClassPeople(@PathVariable String id, @AuthenticationPrincipal AuthUser auth) {
        return schoolClassService.getClassPeople(auth.tenantId(), id, auth);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping("/{id}/gradebook")
    public ClassGradebookResponse getClassGradebook(@PathVariable String id, @AuthenticationPrincipal AuthUser auth) {
        return schoolClassService.getClassGradebook(auth.tenantId(), id, auth);
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PutMapping("/{id}/grading")
    public ClassResponse updateGradingSettings(@PathVariable String id,
                                               @RequestBody GradingSettingsRequest request,
                                               @AuthenticationPrincipal AuthUser auth) {
        return schoolClassService.updateGradingSettings(
                auth.tenantId(), id, auth,
                request.gradingMethod(),
                request.assignmentWeight(),
                request.quizWeight(),
                request.examWeight()
        );
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

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}/students/{studentId}")
    public ResponseEntity<Void> removeStudent(@PathVariable String id,
                                              @PathVariable String studentId,
                                              @AuthenticationPrincipal AuthUser auth) {
        schoolClassService.removeStudent(auth.tenantId(), id, studentId);
        return ResponseEntity.noContent().build();
    }
}