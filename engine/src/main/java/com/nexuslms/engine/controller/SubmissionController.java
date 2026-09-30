package com.nexuslms.engine.controller;

import com.nexuslms.engine.models.Submission;
import com.nexuslms.engine.service.CloudinaryService;
import com.nexuslms.engine.service.SubmissionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

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
    public ResponseEntity<Submission> createSubmission(@Valid @RequestBody Submission submission) {
        Submission created = submissionService.createSubmission(submission);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

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

    @GetMapping("/assignment/{assignmentId}/ungraded")
    public ResponseEntity<List<Submission>> getUngradedSubmissions(@PathVariable String assignmentId) {
        return ResponseEntity.ok(submissionService.getUngradedSubmissions(assignmentId));
    }

    @PostMapping("/{id}/files")
    public ResponseEntity<Submission> addFile(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file) {
        try {
            String fileUrl = cloudinaryService.uploadFile(file, "submissions");
            Submission updated = submissionService.addFile(id, fileUrl);
            return ResponseEntity.ok(updated);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }


    @PreAuthorize("hasRole('TEACHER') OR hasRole('ADMIN')")
    @PatchMapping("/{id}/grade")
    public ResponseEntity<Submission> gradeSubmission(
            @PathVariable String id,
            @RequestBody Map<String, Object> gradeData) {
        Integer grade = (Integer) gradeData.get("grade");
        String feedback = (String) gradeData.get("feedback");
        Submission graded = submissionService.gradeSubmission(id, grade, feedback);
        return ResponseEntity.ok(graded);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubmission(@PathVariable String id) {
        submissionService.deleteSubmission(id);
        return ResponseEntity.noContent().build();
    }
}