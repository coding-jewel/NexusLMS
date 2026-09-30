package com.nexuslms.engine.controller;

import com.nexuslms.engine.models.Assignment;
import com.nexuslms.engine.service.AssignmentService;
import com.nexuslms.engine.service.CloudinaryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Assignment> createAssignment(@Valid @RequestBody Assignment assignment) {
        Assignment created = assignmentService.createAssignment(assignment);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<Assignment>> getAllAssignmentsByCourse(@PathVariable String courseId) {
        return ResponseEntity.ok(assignmentService.getAllAssignmentsByCourse(courseId));
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<Assignment>> getAllAssignmentsByTenant(@PathVariable String tenantId) {
        return ResponseEntity.ok(assignmentService.getAllAssignmentsByTenant(tenantId));
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<Assignment>> getAllAssignmentsByTeacher(@PathVariable String teacherId) {
        return ResponseEntity.ok(assignmentService.getAllAssignmentsByTeacher(teacherId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Assignment> getAssignmentById(@PathVariable String id) {
        return assignmentService.getAssignmentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    @PostMapping("/{id}/attachments")
    public ResponseEntity<Assignment> addAttachment(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file) {
        try {
            String fileUrl = cloudinaryService.uploadFile(file, "assignments");
            Assignment updated = assignmentService.addAttachment(id, fileUrl);
            return ResponseEntity.ok(updated);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssignment(@PathVariable String id) {
        assignmentService.deleteAssignment(id);
        return ResponseEntity.noContent().build();
    }
}