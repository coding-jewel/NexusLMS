package com.nexuslms.engine.controller;

import com.nexuslms.engine.dto.AssignmentRequest;
import com.nexuslms.engine.dto.TeacherAssignmentResponse;
import com.nexuslms.engine.models.Assignment;
import com.nexuslms.engine.security.AuthUser;
import com.nexuslms.engine.service.AssignmentService;
import com.nexuslms.engine.service.CloudinaryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    private final AssignmentService assignmentService;
    private final CloudinaryService cloudinaryService;

    public AssignmentController(AssignmentService assignmentService, CloudinaryService cloudinaryService) {
        this.assignmentService = assignmentService;
        this.cloudinaryService = cloudinaryService;
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping
    public ResponseEntity<Assignment> create(@Valid @RequestBody AssignmentRequest request,
                                             @AuthenticationPrincipal AuthUser auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assignmentService.create(auth, request));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/mine")
    public List<TeacherAssignmentResponse> mine(@AuthenticationPrincipal AuthUser auth) {
        return assignmentService.listForTeacher(auth);
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<Assignment>> getAllAssignmentsByCourse(@PathVariable String courseId) {
        return ResponseEntity.ok(assignmentService.getAllAssignmentsByCourse(courseId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Assignment> getAssignmentById(@PathVariable String id) {
        return assignmentService.getAssignmentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping("/{id}/attachments")
    public ResponseEntity<Assignment> addAttachment(@PathVariable String id,
                                                    @RequestParam("file") MultipartFile file,
                                                    @AuthenticationPrincipal AuthUser auth) {
        try {
            String fileUrl = cloudinaryService.uploadFile(file, "assignments");
            return ResponseEntity.ok(assignmentService.addAttachment(id, fileUrl));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssignment(@PathVariable String id,
                                                 @AuthenticationPrincipal AuthUser auth) {
        assignmentService.deleteAssignment(auth, id);
        return ResponseEntity.noContent().build();
    }
}