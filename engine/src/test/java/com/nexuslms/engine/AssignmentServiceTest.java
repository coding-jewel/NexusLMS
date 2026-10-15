package com.nexuslms.engine;

import com.nexuslms.engine.dto.AssignmentRequest;
import com.nexuslms.engine.exception.NotFoundException;
import com.nexuslms.engine.models.Assignment;
import com.nexuslms.engine.models.Course;
import com.nexuslms.engine.models.Role;
import com.nexuslms.engine.models.User;
import com.nexuslms.engine.repository.AssignmentRepository;
import com.nexuslms.engine.repository.CourseRepository;
import com.nexuslms.engine.repository.SchoolClassRepository;
import com.nexuslms.engine.repository.SubmissionRepository;
import com.nexuslms.engine.repository.UserRepository;
import com.nexuslms.engine.security.AuthUser;
import com.nexuslms.engine.service.AssignmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AssignmentServiceTest {

    @Mock AssignmentRepository assignmentRepository;
    @Mock CourseRepository courseRepository;
    @Mock SchoolClassRepository classRepository;
    @Mock SubmissionRepository submissionRepository;
    @Mock UserRepository userRepository;
    @InjectMocks AssignmentService service;

    private final AuthUser teacher = new AuthUser("u-teacher", "teacher@lincoln.edu", "t1", "TEACHER");

    @BeforeEach
    void setUp() {
        Course course = new Course();
        course.setId("c1");
        course.setTenantId("t1");
        course.setTeacherId("u-teacher");
        when(courseRepository.findById("c1")).thenReturn(Optional.of(course));

        when(assignmentRepository.save(any())).thenAnswer(i -> {
            Assignment a = i.getArgument(0);
            if (a.getId() == null) a.setId("a1");
            return a;
        });
    }

    @Test
    void create_StoresTheTotalMarksFromTheRequest() {
        AssignmentRequest req = new AssignmentRequest(
                "c1", "Worksheet", "Do it", LocalDateTime.now().plusDays(3), 50);

        service.create(teacher, req);

        ArgumentCaptor<Assignment> captor = ArgumentCaptor.forClass(Assignment.class);
        verify(assignmentRepository).save(captor.capture());
        assertEquals(50, captor.getValue().getTotalMarks());
    }

    @Test
    void create_InAnotherTeachersCourse_IsNotFound() {
        when(courseRepository.findById("c1")).thenReturn(Optional.empty());

        AssignmentRequest req = new AssignmentRequest(
                "c1", "Worksheet", null, LocalDateTime.now().plusDays(1), 20);

        assertThrows(NotFoundException.class, () -> service.create(teacher, req));
        verify(assignmentRepository, never()).save(any());
    }
}