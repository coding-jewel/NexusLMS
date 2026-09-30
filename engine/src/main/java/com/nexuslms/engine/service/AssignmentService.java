package com.nexuslms.engine.service;

import com.nexuslms.engine.models.Assignment;
import com.nexuslms.engine.repository.AssignmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;

    public AssignmentService(AssignmentRepository assignmentRepository) {
        this.assignmentRepository = assignmentRepository;
    }

    public Assignment createAssignment(Assignment assignment) {
        return assignmentRepository.save(assignment);
    }

    public List<Assignment> getAllAssignmentsByCourse(String courseId) {
        return assignmentRepository.findAllByCourseId(courseId);
    }

    public List<Assignment> getAllAssignmentsByTenant(String tenantId) {
        return assignmentRepository.findAllByTenantId(tenantId);
    }

    public List<Assignment> getAllAssignmentsByTeacher(String teacherId) {
        return assignmentRepository.findAllByTeacherId(teacherId);
    }

    public Optional<Assignment> getAssignmentById(String id) {
        return assignmentRepository.findById(id);
    }

    public Assignment addAttachment(String id, String fileUrl) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        assignment.getAttachmentUrls().add(fileUrl);
        return assignmentRepository.save(assignment);
    }

    public void deleteAssignment(String id) {
        assignmentRepository.deleteById(id);
    }
}