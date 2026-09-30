package com.nexuslms.engine.service;

import com.nexuslms.engine.exception.DuplicateResourceException;
import com.nexuslms.engine.models.Submission;
import com.nexuslms.engine.repository.SubmissionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SubmissionService {

    private final SubmissionRepository submissionRepository;

    public SubmissionService(SubmissionRepository submissionRepository) {
        this.submissionRepository = submissionRepository;
    }

    public Submission createSubmission(Submission submission) {
        if (submissionRepository.existsByAssignmentIdAndStudentId(
                submission.getAssignmentId(), submission.getStudentId())) {
            throw new DuplicateResourceException("You have already submitted this assignment");
        }
        return submissionRepository.save(submission);
    }

    public List<Submission> getAllSubmissionsByAssignment(String assignmentId) {
        return submissionRepository.findAllByAssignmentId(assignmentId);
    }

    public List<Submission> getAllSubmissionsByStudent(String studentId) {
        return submissionRepository.findAllByStudentId(studentId);
    }

    public Optional<Submission> getSubmissionByAssignmentAndStudent(String assignmentId, String studentId) {
        return submissionRepository.findByAssignmentIdAndStudentId(assignmentId, studentId);
    }

    public Optional<Submission> getSubmissionById(String id) {
        return submissionRepository.findById(id);
    }

    public List<Submission> getUngradedSubmissions(String assignmentId) {
        return submissionRepository.findAllUngradedByAssignmentId(assignmentId);
    }

    public Submission addFile(String id, String fileUrl) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Submission not found"));
        submission.getFileUrls().add(fileUrl);
        return submissionRepository.save(submission);
    }

    public Submission gradeSubmission(String id, Integer grade, String feedback) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Submission not found"));
        submission.setGrade(grade);
        submission.setFeedback(feedback);
        submission.setGraded(true);
        return submissionRepository.save(submission);
    }

    public void deleteSubmission(String id) {
        submissionRepository.deleteById(id);
    }
}