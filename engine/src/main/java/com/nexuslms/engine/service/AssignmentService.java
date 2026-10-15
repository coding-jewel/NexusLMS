package com.nexuslms.engine.service;

import com.nexuslms.engine.dto.AssignmentRequest;
import com.nexuslms.engine.dto.TeacherAssignmentResponse;
import com.nexuslms.engine.exception.InvalidRequestException;
import com.nexuslms.engine.exception.NotFoundException;
import com.nexuslms.engine.models.Assignment;
import com.nexuslms.engine.models.Course;
import com.nexuslms.engine.models.SchoolClass;
import com.nexuslms.engine.repository.AssignmentRepository;
import com.nexuslms.engine.repository.CourseRepository;
import com.nexuslms.engine.repository.SchoolClassRepository;
import com.nexuslms.engine.repository.SubmissionRepository;
import com.nexuslms.engine.repository.UserRepository;
import com.nexuslms.engine.security.AuthUser;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final CourseRepository courseRepository;
    private final SchoolClassRepository classRepository;
    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;

    public AssignmentService(AssignmentRepository assignmentRepository,
                             CourseRepository courseRepository,
                             SchoolClassRepository classRepository,
                             SubmissionRepository submissionRepository,
                             UserRepository userRepository) {
        this.assignmentRepository = assignmentRepository;
        this.courseRepository = courseRepository;
        this.classRepository = classRepository;
        this.submissionRepository = submissionRepository;
        this.userRepository = userRepository;
    }

    public Assignment create(AuthUser auth, AssignmentRequest request) {
        Course course = courseRepository.findById(request.courseId())
                .filter(c -> auth.tenantId().equals(c.getTenantId()))
                .filter(c -> auth.userId().equals(c.getTeacherId()))
                .orElseThrow(() -> new NotFoundException("Course not found"));

        Assignment a = new Assignment();
        a.setTenantId(auth.tenantId());
        a.setCourseId(course.getId());
        a.setTeacherId(auth.userId());
        a.setTitle(request.title().trim());
        a.setDescription(request.description() == null ? null : request.description().trim());
        a.setDueDate(request.dueDate());
        a.setTotalMarks(request.totalMarks());
        return assignmentRepository.save(a);
    }

    public List<TeacherAssignmentResponse> listForTeacher(AuthUser auth) {
        List<Course> courses = courseRepository.findAllByTeacherId(auth.userId());
        if (courses.isEmpty()) return List.of();

        Map<String, SchoolClass> classesById = new HashMap<>();
        Map<String, Long> classStudentCounts = new HashMap<>();
        for (Course c : courses) {
            classesById.computeIfAbsent(c.getClassId(),
                    id -> classRepository.findById(id).orElse(null));
            classStudentCounts.computeIfAbsent(c.getClassId(),
                    id -> userRepository.countStudentsInClass(id));
        }

        List<TeacherAssignmentResponse> out = new ArrayList<>();
        for (Course c : courses) {
            SchoolClass schoolClass = classesById.get(c.getClassId());
            long total = classStudentCounts.getOrDefault(c.getClassId(), 0L);
            for (Assignment a : assignmentRepository.findAllByCourseId(c.getId())) {
                out.add(new TeacherAssignmentResponse(
                        a.getId(),
                        a.getTitle(),
                        c.getId(),
                        c.getTitle(),
                        schoolClass == null ? "" : schoolClass.getName(),
                        a.getDueDate(),
                        submissionRepository.countByAssignmentId(a.getId()),
                        total,
                        submissionRepository.countByAssignmentIdAndGradedFalse(a.getId())));
            }
        }

        out.sort(Comparator.comparing(
                TeacherAssignmentResponse::dueDate,
                Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        return out;
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
                .orElseThrow(() -> new NotFoundException("Assignment not found"));
        assignment.getAttachmentUrls().add(fileUrl);
        return assignmentRepository.save(assignment);
    }

    /** Only the owning teacher may delete. Refused once students have submitted. */
    public void deleteAssignment(AuthUser auth, String id) {
        Assignment assignment = assignmentRepository.findById(id)
                .filter(a -> auth.tenantId().equals(a.getTenantId()))
                .filter(a -> auth.userId().equals(a.getTeacherId()))
                .orElseThrow(() -> new NotFoundException("Assignment not found"));
        long subs = submissionRepository.countByAssignmentId(assignment.getId());
        if (subs > 0) {
            throw new InvalidRequestException("This assignment already has submissions. You can't delete it now.");
        }
        assignmentRepository.deleteById(assignment.getId());
    }
}