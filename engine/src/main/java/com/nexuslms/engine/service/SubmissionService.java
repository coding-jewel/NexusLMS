package com.nexuslms.engine.service;

import com.nexuslms.engine.dto.GradeSubmissionRequest;
import com.nexuslms.engine.dto.SubmissionRequest;
import com.nexuslms.engine.exception.DuplicateResourceException;
import com.nexuslms.engine.exception.InvalidRequestException;
import com.nexuslms.engine.exception.NotFoundException;
import com.nexuslms.engine.models.Assignment;
import com.nexuslms.engine.models.Course;
import com.nexuslms.engine.models.Submission;
import com.nexuslms.engine.models.User;
import com.nexuslms.engine.repository.AssignmentRepository;
import com.nexuslms.engine.repository.CourseRepository;
import com.nexuslms.engine.repository.SubmissionRepository;
import com.nexuslms.engine.repository.UserRepository;
import com.nexuslms.engine.security.AuthUser;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final GradeService gradeService;

    public SubmissionService(SubmissionRepository submissionRepository,
                             AssignmentRepository assignmentRepository,
                             CourseRepository courseRepository,
                             UserRepository userRepository,
                             GradeService gradeService) {
        this.submissionRepository = submissionRepository;
        this.assignmentRepository = assignmentRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.gradeService = gradeService;
    }

    /** A student hands in their work. Late submissions are flagged, not rejected. */
    public Submission createSubmission(AuthUser auth, SubmissionRequest request) {
        Assignment assignment = assignmentRepository.findById(request.assignmentId())
                .orElseThrow(() -> new NotFoundException("Assignment not found"));
        Course course = courseRepository.findById(assignment.getCourseId())
                .orElseThrow(() -> new NotFoundException("Assignment not found"));
        User me = userRepository.findById(auth.userId())
                .filter(u -> auth.tenantId().equals(u.getTenantId()))
                .orElseThrow(() -> new NotFoundException("Assignment not found"));

        if (!me.getClassIds().contains(course.getClassId())) {
            throw new NotFoundException("Assignment not found");
        }
        if (submissionRepository.existsByAssignmentIdAndStudentId(assignment.getId(), auth.userId())) {
            throw new DuplicateResourceException("You have already submitted this assignment");
        }

        Submission s = new Submission();
        s.setTenantId(auth.tenantId());
        s.setAssignmentId(assignment.getId());
        s.setStudentId(auth.userId());
        s.setText(request.text() == null ? null : request.text().trim());
        s.setLate(assignment.getDueDate() != null && LocalDateTime.now().isAfter(assignment.getDueDate()));
        return submissionRepository.save(s);
    }

    /** The signed-in student's own submission to an assignment, if they've made one. */
    public Optional<Submission> mySubmissionFor(AuthUser auth, String assignmentId) {
        return submissionRepository.findByAssignmentIdAndStudentId(assignmentId, auth.userId())
                .filter(s -> auth.tenantId().equals(s.getTenantId()));
    }

    /**
     * The signed-in student deletes their own submission so they can hand in again.
     * Only allowed while the teacher hasn't graded it yet.
     */
    public void unsubmit(AuthUser auth, String assignmentId) {
        Submission submission = submissionRepository
                .findByAssignmentIdAndStudentId(assignmentId, auth.userId())
                .filter(s -> auth.tenantId().equals(s.getTenantId()))
                .orElseThrow(() -> new NotFoundException("You haven't submitted this assignment."));
        if (submission.isGraded()) {
            throw new InvalidRequestException("This has already been graded. Ask your teacher if you need to change something.");
        }
        submissionRepository.deleteById(submission.getId());
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

    /** Only the owning student can attach files to their own submission. */
    public Submission addFile(AuthUser auth, String id, String fileUrl) {
        Submission submission = submissionRepository.findById(id)
                .filter(s -> auth.tenantId().equals(s.getTenantId()))
                .filter(s -> auth.userId().equals(s.getStudentId()))
                .orElseThrow(() -> new NotFoundException("Submission not found"));
        submission.getFileUrls().add(fileUrl);
        return submissionRepository.save(submission);
    }

    public Submission gradeSubmission(AuthUser auth, String submissionId, GradeSubmissionRequest request) {
        Submission submission = submissionRepository.findById(submissionId)
                .filter(s -> auth.tenantId().equals(s.getTenantId()))
                .orElseThrow(() -> new NotFoundException("Submission not found"));
        Assignment assignment = assignmentRepository.findById(submission.getAssignmentId())
                .filter(a -> auth.userId().equals(a.getTeacherId()))
                .orElseThrow(() -> new NotFoundException("Submission not found"));

        if (request.grade() > assignment.getTotalMarks()) {
            throw new InvalidRequestException(
                    "Grade can't be higher than the assignment's total of " + assignment.getTotalMarks() + ".");
        }

        submission.setGrade(request.grade());
        submission.setFeedback(request.feedback() == null ? null : request.feedback().trim());
        submission.setGraded(true);
        Submission saved = submissionRepository.save(submission);

        gradeService.upsertSubmissionGrade(
                saved.getTenantId(), saved.getStudentId(),
                assignment.getCourseId(), assignment.getId(),
                saved.getGrade(), assignment.getTotalMarks(), saved.getFeedback());

        return saved;
    }

    public void deleteSubmission(String id) {
        submissionRepository.deleteById(id);
    }
}