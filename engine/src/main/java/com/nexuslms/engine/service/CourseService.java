package com.nexuslms.engine.service;

import com.nexuslms.engine.dto.CourseRequest;
import com.nexuslms.engine.dto.CourseResponse;
import com.nexuslms.engine.exception.DuplicateResourceException;
import com.nexuslms.engine.exception.InvalidRequestException;
import com.nexuslms.engine.exception.NotFoundException;
import com.nexuslms.engine.models.Assignment;
import com.nexuslms.engine.models.Course;
import com.nexuslms.engine.models.Quiz;
import com.nexuslms.engine.models.Role;
import com.nexuslms.engine.models.SchoolClass;
import com.nexuslms.engine.models.User;
import com.nexuslms.engine.repository.AssignmentRepository;
import com.nexuslms.engine.repository.CourseRepository;
import com.nexuslms.engine.repository.GradeRepository;
import com.nexuslms.engine.repository.QuizAttemptRepository;
import com.nexuslms.engine.repository.QuizRepository;
import com.nexuslms.engine.repository.SchoolClassRepository;
import com.nexuslms.engine.repository.SubmissionRepository;
import com.nexuslms.engine.repository.UserRepository;
import com.nexuslms.engine.security.AuthUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CourseService {

    private static final String NOT_FOUND = "Course not found";

    private final CourseRepository courseRepository;
    private final SchoolClassRepository classRepository;
    private final UserRepository userRepository;
    private final AssignmentRepository assignmentRepository;
    private final QuizRepository quizRepository;
    private final SubmissionRepository submissionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final GradeRepository gradeRepository;

    public CourseService(CourseRepository courseRepository, SchoolClassRepository classRepository,
                         UserRepository userRepository, AssignmentRepository assignmentRepository,
                         QuizRepository quizRepository, SubmissionRepository submissionRepository,
                         QuizAttemptRepository quizAttemptRepository, GradeRepository gradeRepository) {
        this.courseRepository = courseRepository;
        this.classRepository = classRepository;
        this.userRepository = userRepository;
        this.assignmentRepository = assignmentRepository;
        this.quizRepository = quizRepository;
        this.submissionRepository = submissionRepository;
        this.quizAttemptRepository = quizAttemptRepository;
        this.gradeRepository = gradeRepository;
    }

    public CourseResponse create(AuthUser auth, CourseRequest request) {
        SchoolClass schoolClass = classRepository.findById(request.classId())
                .filter(c -> auth.tenantId().equals(c.getTenantId()))
                .orElseThrow(() -> new NotFoundException("Class not found"));
        boolean assigned = userRepository.findById(auth.userId())
                .filter(u -> auth.tenantId().equals(u.getTenantId()))
                .map(u -> u.getClassIds().contains(schoolClass.getId()))
                .orElse(false);
        if (!assigned) {
            throw new InvalidRequestException("You aren't assigned to this class. Ask your admin to add you.");
        }
        String title = request.title().trim();
        if (courseRepository.existsByTitleAndClassId(title, schoolClass.getId())) {
            throw new DuplicateResourceException("A course with this title already exists in this class");
        }
        Course course = new Course();
        course.setTenantId(auth.tenantId());
        course.setClassId(schoolClass.getId());
        course.setTeacherId(auth.userId());
        course.setTitle(title);
        course.setDescription(request.description() == null ? null : request.description().trim());
        course.setPublished(false);
        return respond(auth.tenantId(), List.of(courseRepository.save(course))).get(0);
    }

    // NEW: Update method to edit the topic title and description
    public CourseResponse updateCourse(AuthUser auth, String id, CourseRequest request) {
        Course course = owned(auth, id);

        String title = request.title().trim();
        // Check if title changed and if new title already exists in the class
        if (!course.getTitle().equals(title) && courseRepository.existsByTitleAndClassId(title, course.getClassId())) {
            throw new DuplicateResourceException("A course with this title already exists in this class");
        }

        course.setTitle(title);
        course.setDescription(request.description() == null ? null : request.description().trim());

        return respond(auth.tenantId(), List.of(courseRepository.save(course))).get(0);
    }

    public List<CourseResponse> list(AuthUser auth) {
        List<Course> courses = switch (Role.valueOf(auth.role())) {
            case ADMIN -> courseRepository.findAllByTenantId(auth.tenantId());
            case TEACHER -> courseRepository.findAllByTeacherId(auth.userId());
            case STUDENT -> studentCourses(auth);
        };
        return respond(auth.tenantId(), courses.stream()
                .filter(c -> sameSchool(auth, c))
                .sorted(Comparator.comparing(Course::getTitle, String.CASE_INSENSITIVE_ORDER))
                .toList());
    }

    public CourseResponse get(AuthUser auth, String id) {
        return respond(auth.tenantId(), List.of(visible(auth, id))).get(0);
    }

    public CourseResponse publish(AuthUser auth, String id) {
        Course course = owned(auth, id);
        course.setPublished(true);
        return respond(auth.tenantId(), List.of(courseRepository.save(course))).get(0);
    }

    public CourseResponse unpublish(AuthUser auth, String id) {
        Course course = owned(auth, id);
        course.setPublished(false);
        return respond(auth.tenantId(), List.of(courseRepository.save(course))).get(0);
    }

    @Transactional
    public void delete(AuthUser auth, String id) {
        Course course = owned(auth, id);

        List<Assignment> assignments = assignmentRepository.findAllByCourseId(course.getId());
        List<Quiz> quizzes = quizRepository.findAllQuizzesByCourseId(course.getId());

        List<String> assignmentIds = assignments.stream().map(Assignment::getId).toList();
        List<String> quizIds = quizzes.stream().map(Quiz::getId).toList();

        if (!assignmentIds.isEmpty()) {
            submissionRepository.deleteByAssignmentIdIn(assignmentIds);
        }
        if (!quizIds.isEmpty()) {
            quizAttemptRepository.deleteByQuizIdIn(quizIds);
        }

        gradeRepository.deleteByCourseId(course.getId());
        assignmentRepository.deleteByCourseId(course.getId());
        quizRepository.deleteByCourseId(course.getId());
        courseRepository.deleteById(course.getId());
    }

    public CourseResponse attachFile(AuthUser auth, String id, String fileUrl) {
        Course course = owned(auth, id);
        course.getAttachmentUrls().add(fileUrl);
        return respond(auth.tenantId(), List.of(courseRepository.save(course))).get(0);
    }

    public CourseResponse detachFile(AuthUser auth, String id, String fileUrl) {
        Course course = owned(auth, id);
        course.getAttachmentUrls().remove(fileUrl);
        return respond(auth.tenantId(), List.of(courseRepository.save(course))).get(0);
    }

    // --- helpers ---

    private boolean sameSchool(AuthUser auth, Course course) {
        return auth.tenantId().equals(course.getTenantId());
    }

    private List<Course> studentCourses(AuthUser auth) {
        List<Course> courses = new ArrayList<>();
        for (String classId : studentClassIds(auth)) {
            courses.addAll(courseRepository.findAllByClassId(classId));
        }
        return courses.stream().filter(Course::isPublished).toList();
    }

    private List<String> studentClassIds(AuthUser auth) {
        return userRepository.findById(auth.userId())
                .filter(u -> auth.tenantId().equals(u.getTenantId()))
                .map(User::getClassIds)
                .orElse(List.of());
    }

    private Course visible(AuthUser auth, String id) {
        Course course = courseRepository.findById(id)
                .filter(c -> sameSchool(auth, c))
                .orElseThrow(() -> new NotFoundException(NOT_FOUND));
        boolean allowed = switch (Role.valueOf(auth.role())) {
            case ADMIN -> true;
            case TEACHER -> auth.userId().equals(course.getTeacherId());
            case STUDENT -> course.isPublished() && studentClassIds(auth).contains(course.getClassId());
        };
        if (!allowed) {
            throw new NotFoundException(NOT_FOUND);
        }
        return course;
    }

    public Course owned(AuthUser auth, String id) {
        return courseRepository.findById(id)
                .filter(c -> sameSchool(auth, c) && auth.userId().equals(c.getTeacherId()))
                .orElseThrow(() -> new NotFoundException(NOT_FOUND));
    }

    private List<CourseResponse> respond(String tenantId, List<Course> courses) {
        Map<String, String> classNames = new HashMap<>();
        for (SchoolClass c : classRepository.findAllByTenantId(tenantId)) {
            classNames.put(c.getId(), c.getName());
        }
        Map<String, String> teacherNames = new HashMap<>();
        for (User u : userRepository.findAllByTenantIdAndRole(tenantId, Role.TEACHER.name())) {
            teacherNames.put(u.getId(), u.getName());
        }
        return courses.stream()
                .map(c -> CourseResponse.from(c,
                        classNames.get(c.getClassId()),
                        teacherNames.get(c.getTeacherId()),
                        assignmentRepository.countByCourseId(c.getId()),
                        quizRepository.countQuizzesByCourseId(c.getId())))
                .toList();
    }
}