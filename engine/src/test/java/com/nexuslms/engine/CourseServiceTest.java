package com.nexuslms.engine;

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
import com.nexuslms.engine.service.CourseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CourseServiceTest {

    @Mock CourseRepository courseRepository;
    @Mock SchoolClassRepository classRepository;
    @Mock UserRepository userRepository;
    @Mock AssignmentRepository assignmentRepository;
    @Mock QuizRepository quizRepository;
    @InjectMocks CourseService service;

    private final AuthUser teacher = new AuthUser("u-teacher", "teacher@lincoln.edu", "t1", "TEACHER");
    private final AuthUser otherTeacher = new AuthUser("u-other", "other@lincoln.edu", "t1", "TEACHER");
    private final AuthUser admin = new AuthUser("u-admin", "admin@lincoln.edu", "t1", "ADMIN");
    private final AuthUser student = new AuthUser("u-student", "student@lincoln.edu", "t1", "STUDENT");

    @BeforeEach
    void setUp() {
        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setId("c1");
        schoolClass.setTenantId("t1");
        schoolClass.setName("JSS 3 Green");
        when(classRepository.findById("c1")).thenReturn(Optional.of(schoolClass));
        when(classRepository.findAllByTenantId("t1")).thenReturn(List.of(schoolClass));

        User teacherUser = new User();
        teacherUser.setId("u-teacher");
        teacherUser.setTenantId("t1");
        teacherUser.setName("Ms Okafor");
        teacherUser.setRole(Role.TEACHER);
        when(userRepository.findAllByTenantIdAndRole("t1", "TEACHER")).thenReturn(List.of(teacherUser));

        User studentUser = new User();
        studentUser.setId("u-student");
        studentUser.setTenantId("t1");
        studentUser.setName("Ada");
        studentUser.setRole(Role.STUDENT);
        studentUser.setClassIds(new ArrayList<>(List.of("c1", "c2")));
        when(userRepository.findById("u-student")).thenReturn(Optional.of(studentUser));

        when(courseRepository.save(any())).thenAnswer(i -> {
            Course c = i.getArgument(0);
            if (c.getId() == null) {
                c.setId("course1");
            }
            return c;
        });
    }

    private Course course(String id, String tenantId, String classId, String teacherId, boolean published) {
        Course c = new Course();
        c.setId(id);
        c.setTenantId(tenantId);
        c.setClassId(classId);
        c.setTeacherId(teacherId);
        c.setTitle("Course " + id);
        c.setPublished(published);
        return c;
    }

    // --- create ---

    @Test
    void create_TakesSchoolAndTeacherFromTheCaller_AndStartsUnpublished() {
        CourseResponse result = service.create(teacher, new CourseRequest("c1", "  Mathematics  ", "  Algebra  "));

        ArgumentCaptor<Course> captor = ArgumentCaptor.forClass(Course.class);
        verify(courseRepository).save(captor.capture());
        Course saved = captor.getValue();
        assertEquals("t1", saved.getTenantId());
        assertEquals("u-teacher", saved.getTeacherId());
        assertEquals("Mathematics", saved.getTitle());
        assertEquals("Algebra", saved.getDescription());
        assertFalse(saved.isPublished());
        assertEquals("JSS 3 Green", result.className());
        assertEquals("Ms Okafor", result.teacherName());
    }

    @Test
    void create_InAClassFromAnotherSchool_IsNotFound() {
        SchoolClass foreign = new SchoolClass();
        foreign.setId("c-foreign");
        foreign.setTenantId("other-school");
        when(classRepository.findById("c-foreign")).thenReturn(Optional.of(foreign));

        assertThrows(NotFoundException.class, () -> service.create(teacher, new CourseRequest("c-foreign", "Maths", null)));

        verify(courseRepository, never()).save(any());
    }

    @Test
    void create_DuplicateTitleInTheSameClass_IsRefused() {
        when(courseRepository.existsByTitleAndClassId("Maths", "c1")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> service.create(teacher, new CourseRequest("c1", "Maths", null)));

        verify(courseRepository, never()).save(any());
    }

    // --- list ---

    @Test
    void list_Admin_SeesEveryCourseInTheirSchool() {
        when(courseRepository.findAllByTenantId("t1")).thenReturn(List.of(
                course("a", "t1", "c1", "u-teacher", true),
                course("b", "t1", "c1", "u-other", false)));

        assertEquals(2, service.list(admin).size());
    }

    @Test
    void list_Teacher_SeesOnlyTheirOwnCourses() {
        when(courseRepository.findAllByTeacherId("u-teacher")).thenReturn(List.of(course("a", "t1", "c1", "u-teacher", false)));

        List<CourseResponse> result = service.list(teacher);

        assertEquals(1, result.size());
        verify(courseRepository, never()).findAllByTenantId(any());
    }

    @Test
    void list_Student_SeesOnlyPublishedCoursesOfTheirOwnClass() {
        when(courseRepository.findAllByClassId("c1")).thenReturn(List.of(
                course("live", "t1", "c1", "u-teacher", true),
                course("draft", "t1", "c1", "u-teacher", false)));

        List<CourseResponse> result = service.list(student);

        assertEquals(1, result.size());
        assertEquals("live", result.get(0).id());
    }

    @Test
    void list_StudentInSeveralClasses_SeesPublishedCoursesFromAllOfThem() {
        when(courseRepository.findAllByClassId("c1")).thenReturn(List.of(course("one", "t1", "c1", "u-teacher", true)));
        when(courseRepository.findAllByClassId("c2")).thenReturn(List.of(
                course("two", "t1", "c2", "u-teacher", true),
                course("hidden", "t1", "c2", "u-teacher", false)));

        List<CourseResponse> result = service.list(student);

        assertEquals(2, result.size());
        assertTrue(result.stream().anyMatch(c -> c.id().equals("one")));
        assertTrue(result.stream().anyMatch(c -> c.id().equals("two")));
    }

    @Test
    void list_StudentWithNoClass_SeesNothing() {
        User loose = new User();
        loose.setId("u-loose");
        loose.setTenantId("t1");
        when(userRepository.findById("u-loose")).thenReturn(Optional.of(loose)); // no classes

        assertTrue(service.list(new AuthUser("u-loose", "x@lincoln.edu", "t1", "STUDENT")).isEmpty());

        verify(courseRepository, never()).findAllByClassId(any());
    }

    // --- get ---

    @Test
    void get_CourseFromAnotherSchool_IsNotFound() {
        when(courseRepository.findById("x")).thenReturn(Optional.of(course("x", "other-school", "c9", "u-teacher", true)));

        assertThrows(NotFoundException.class, () -> service.get(admin, "x"));
    }

    @Test
    void get_AnotherTeachersCourse_IsNotFound() {
        when(courseRepository.findById("a")).thenReturn(Optional.of(course("a", "t1", "c1", "u-teacher", true)));

        assertThrows(NotFoundException.class, () -> service.get(otherTeacher, "a"));
        assertEquals("a", service.get(teacher, "a").id());
    }

    @Test
    void get_UnpublishedCourse_IsHiddenFromStudents() {
        when(courseRepository.findById("draft")).thenReturn(Optional.of(course("draft", "t1", "c1", "u-teacher", false)));

        assertThrows(NotFoundException.class, () -> service.get(student, "draft"));
    }

    @Test
    void get_CourseInTheirSecondClass_IsVisibleToStudents() {
        when(courseRepository.findById("second")).thenReturn(Optional.of(course("second", "t1", "c2", "u-teacher", true)));

        assertEquals("second", service.get(student, "second").id());
    }

    @Test
    void get_CourseOfAnotherClass_IsHiddenFromStudents() {
        when(courseRepository.findById("far")).thenReturn(Optional.of(course("far", "t1", "c3", "u-teacher", true)));

        assertThrows(NotFoundException.class, () -> service.get(student, "far"));
    }

    // --- publish ---

    @Test
    void publish_OwnCourse_Success() {
        when(courseRepository.findById("a")).thenReturn(Optional.of(course("a", "t1", "c1", "u-teacher", false)));

        assertTrue(service.publish(teacher, "a").published());
    }

    @Test
    void publish_AnotherTeachersCourse_IsNotFoundAndNothingIsSaved() {
        when(courseRepository.findById("a")).thenReturn(Optional.of(course("a", "t1", "c1", "u-teacher", false)));

        assertThrows(NotFoundException.class, () -> service.publish(otherTeacher, "a"));

        verify(courseRepository, never()).save(any());
    }

    @Test
    void publish_MissingCourse_IsNotFound() {
        when(courseRepository.findById("nope")).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.publish(teacher, "nope"));
    }

    // --- delete ---

    @Test
    void delete_OwnEmptyCourse_Success() {
        when(courseRepository.findById("a")).thenReturn(Optional.of(course("a", "t1", "c1", "u-teacher", false)));

        service.delete(teacher, "a");

        verify(courseRepository).deleteById("a");
    }

    @Test
    void delete_CourseWithAssignmentsOrQuizzes_IsRefused() {
        when(courseRepository.findById("a")).thenReturn(Optional.of(course("a", "t1", "c1", "u-teacher", false)));
        when(assignmentRepository.existsByCourseId("a")).thenReturn(true);

        assertThrows(InvalidRequestException.class, () -> service.delete(teacher, "a"));

        when(assignmentRepository.existsByCourseId("a")).thenReturn(false);
        when(quizRepository.existsByCourseId("a")).thenReturn(true);

        assertThrows(InvalidRequestException.class, () -> service.delete(teacher, "a"));
        verify(courseRepository, never()).deleteById(any());
    }

    @Test
    void delete_AnotherTeachersCourse_IsNotFoundAndNothingIsDeleted() {
        when(courseRepository.findById("a")).thenReturn(Optional.of(course("a", "t1", "c1", "u-teacher", false)));

        assertThrows(NotFoundException.class, () -> service.delete(otherTeacher, "a"));

        verify(courseRepository, never()).deleteById(any());
    }
}