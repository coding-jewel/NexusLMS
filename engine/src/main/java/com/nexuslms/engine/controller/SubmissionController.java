package com.nexuslms.engine.controller;

import com.nexuslms.engine.dto.GradeSubmissionRequest;
import com.nexuslms.engine.dto.SubmissionRequest;
import com.nexuslms.engine.models.Submission;
import com.nexuslms.engine.security.AuthUser;
import com.nexuslms.engine.service.CloudinaryService;
import com.nexuslms.engine.service.SubmissionService;
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
@RequestMapping("/api/submissions")
public class SubmissionController {

    private final SubmissionService submissionService;
    private final CloudinaryService cloudinaryService;

    public SubmissionController(SubmissionService submissionService, CloudinaryService cloudinaryService) {
        this.submissionService = submissionService;
        this.cloudinaryService = cloudinaryService;
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping
    public ResponseEntity<Submission> createSubmission(@Valid @RequestBody SubmissionRequest request,
                                                       @AuthenticationPrincipal AuthUser auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(submissionService.createSubmission(auth, request));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/assignment/{assignmentId}")
    public ResponseEntity<List<Submission>> getAllSubmissionsByAssignment(@PathVariable String assignmentId) {
        return ResponseEntity.ok(submissionService.getAllSubmissionsByAssignment(assignmentId));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Submission>> getAllSubmissionsByStudent(@PathVariable String studentId) {
        return ResponseEntity.ok(submissionService.getAllSubmissionsByStudent(studentId));
    }

    @GetMapping("/assignment/{assignmentId}/student/{studentId}")
    public ResponseEntity<Submission> getSubmissionByAssignmentAndStudent(
            @PathVariable String assignmentId,
            @PathVariable String studentId) {
        return submissionService.getSubmissionByAssignmentAndStudent(assignmentId, studentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Submission> getSubmissionById(@PathVariable String id) {
        return submissionService.getSubmissionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/assignment/{assignmentId}/ungraded")
    public ResponseEntity<List<Submission>> getUngradedSubmissions(@PathVariable String assignmentId) {
        return ResponseEntity.ok(submissionService.getUngradedSubmissions(assignmentId));
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/{id}/files")
    public ResponseEntity<Submission> addFile(@PathVariable String id,
                                              @RequestParam("file") MultipartFile file,
                                              @AuthenticationPrincipal AuthUser auth) {
        try {
            String fileUrl = cloudinaryService.uploadFile(file, "submissions");
            return ResponseEntity.ok(submissionService.addFile(id, fileUrl));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PatchMapping("/{id}/grade")
    public ResponseEntity<Submission> gradeSubmission(@PathVariable String id,
                                                      @Valid @RequestBody GradeSubmissionRequest request,
                                                      @AuthenticationPrincipal AuthUser auth) {
        return ResponseEntity.ok(submissionService.gradeSubmission(auth, id, request));
    }

    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubmission(@PathVariable String id) {
        submissionService.deleteSubmission(id);
        return ResponseEntity.noContent().build();
    }
}