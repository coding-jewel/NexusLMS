package com.nexuslms.engine.service;

import com.nexuslms.engine.dto.CourseRequest;
import com.nexuslms.engine.dto.CourseResponse;
import com.nexuslms.engine.exception.DuplicateResourceException;
import com.nexuslms.engine.exception.InvalidRequestException;
import com.nexuslms.engine.exception.NotFoundException;
import com.nexuslms.engine.models.Course;
import com.nexuslms.engine.models.Role;
import com.nexuslms.engine.models.SchoolClass;
import com.nexuslms.engine.models.User;
import com.nexuslms.engine.repository.AssignmentRepository;
import com.nexuslms.engine.repository.CourseRepository;
import com.nexuslms.engine.repository.QuizRepository;
import com.nexuslms.engine.repository.SchoolClassRepository;
import com.nexuslms.engine.repository.UserRepository;
import com.nexuslms.engine.security.AuthUser;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// Every method takes the school and the caller from the signed-in user, never from the request.
// A course the caller isn't allowed to see looks exactly like a course that doesn't exist.
//   admin:   every course in their school (read only)
//   teacher: their own courses
//   student: published courses of the classes they belong to
@Service
public class CourseService {

    private static final String NOT_FOUND = "Course not found";

    private final CourseRepository courseRepository;
    private final SchoolClassRepository classRepository;
    private final UserRepository userRepository;
    private final AssignmentRepository assignmentRepository;
    private final QuizRepository quizRepository;

    public CourseService(CourseRepository courseRepository, SchoolClassRepository classRepository,
                         UserRepository userRepository, AssignmentRepository assignmentRepository,
                         QuizRepository quizRepository) {
        this.courseRepository = courseRepository;
        this.classRepository = classRepository;
        this.userRepository = userRepository;
        this.assignmentRepository = assignmentRepository;
        this.quizRepository = quizRepository;
    }

    /** A teacher creates a course in one of their school's classes. It starts unpublished. */
    public CourseResponse create(AuthUser auth, CourseRequest request) {
        SchoolClass schoolClass = classRepository.findById(request.classId())
                .filter(c -> auth.tenantId().equals(c.getTenantId()))
                .orElseThrow(() -> new NotFoundException("Class not found"));
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

    public void delete(AuthUser auth, String id) {
        Course course = owned(auth, id);
        if (assignmentRepository.existsByCourseId(course.getId()) || quizRepository.existsByCourseId(course.getId())) {
            throw new InvalidRequestException("This course still has assignments or quizzes. Delete them first.");
        }
        courseRepository.deleteById(course.getId());
    }

    // --- who may see or change what ---

    private boolean sameSchool(AuthUser auth, Course course) {
        return auth.tenantId().equals(course.getTenantId());
    }

    // A student sees the published courses of every class they belong to.
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

    // Changing a course is for the teacher who owns it.
    private Course owned(AuthUser auth, String id) {
        return courseRepository.findById(id)
                .filter(c -> sameSchool(auth, c) && auth.userId().equals(c.getTeacherId()))
                .orElseThrow(() -> new NotFoundException(NOT_FOUND));
    }

    // Adds the class name and teacher name that the pages show next to each course.
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
                .map(c -> CourseResponse.from(c, classNames.get(c.getClassId()), teacherNames.get(c.getTeacherId())))
                .toList();
    }
}