package com.nexuslms.engine;

import com.nexuslms.engine.exception.DuplicateResourceException;
import com.nexuslms.engine.exception.InvalidRequestException;
import com.nexuslms.engine.exception.NotFoundException;
import com.nexuslms.engine.models.Role;
import com.nexuslms.engine.models.User;
import com.nexuslms.engine.repository.CourseRepository;
import com.nexuslms.engine.repository.UserRepository;
import com.nexuslms.engine.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private CourseRepository courseRepository;

    @InjectMocks
    private UserService userService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId("1");
        user.setTenantId("tenant1");
        user.setName("John Doe");
        user.setEmail("john@lincoln.com");
        user.setPassword("password123");
        user.setRole(Role.STUDENT);
    }

    private User person(String id, String tenantId, String name, Role role, String classId) {
        User u = new User();
        u.setId(id);
        u.setTenantId(tenantId);
        u.setName(name);
        u.setEmail(id + "@lincoln.com");
        u.setPassword("hash");
        u.setRole(role);
        if (classId != null) {
            u.setClassIds(new ArrayList<>(List.of(classId.split(","))));
        }
        return u;
    }

    private User waitingTeacher(String id, String tenantId) {
        User u = person(id, tenantId, "Mr Bello", Role.TEACHER, null);
        u.setApproved(false);
        return u;
    }

    @Test
    void createUser_Success() {
        when(userRepository.existsByEmailAndTenantId("john@lincoln.com", "tenant1"))
                .thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashedpassword");
        when(userRepository.save(user)).thenReturn(user);

        User result = userService.createUser(user);

        assertNotNull(result);
        assertEquals("hashedpassword", result.getPassword());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void createUser_DuplicateEmail_ThrowsException() {
        when(userRepository.existsByEmailAndTenantId("john@lincoln.com", "tenant1"))
                .thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> {
            userService.createUser(user);
        });

        verify(userRepository, never()).save(any());
    }

    @Test
    void createUser_PasswordIsHashed() {
        when(userRepository.existsByEmailAndTenantId(anyString(), anyString()))
                .thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("$2a$10$hashedvalue");
        when(userRepository.save(user)).thenReturn(user);

        User result = userService.createUser(user);

        assertNotEquals("password123", result.getPassword());
        assertEquals("$2a$10$hashedvalue", result.getPassword());
    }

    @Test
    void getUserById_Found() {
        when(userRepository.findById("1")).thenReturn(Optional.of(user));

        Optional<User> result = userService.getUserById("1");

        assertTrue(result.isPresent());
        assertEquals("john@lincoln.com", result.get().getEmail());
    }

    @Test
    void getUserById_NotFound() {
        when(userRepository.findById("999")).thenReturn(Optional.empty());

        Optional<User> result = userService.getUserById("999");

        assertFalse(result.isPresent());
    }

    // --- the admin's view of their own school ---

    @Test
    void list_ReturnsTheWholeSchoolSortedByName() {
        when(userRepository.findAllByTenantId("tenant1")).thenReturn(List.of(
                person("u2", "tenant1", "zara", Role.STUDENT, "c1"),
                person("u1", "tenant1", "Amaka", Role.TEACHER, null)));

        List<User> result = userService.list("tenant1", null, null);

        assertEquals(List.of("Amaka", "zara"), result.stream().map(User::getName).toList());
        verify(userRepository, never()).findAllByTenantIdAndRole(any(), any());
    }

    @Test
    void list_FiltersByRole() {
        when(userRepository.findAllByTenantIdAndRole("tenant1", "TEACHER"))
                .thenReturn(List.of(person("u1", "tenant1", "Amaka", Role.TEACHER, null)));

        List<User> result = userService.list("tenant1", "teacher", null);

        assertEquals(1, result.size());
        verify(userRepository, never()).findAllByTenantId(any());
    }

    @Test
    void list_FiltersByClass() {
        when(userRepository.findAllByTenantIdAndRole("tenant1", "STUDENT")).thenReturn(List.of(
                person("u1", "tenant1", "Ada", Role.STUDENT, "c1"),
                person("u2", "tenant1", "Bola", Role.STUDENT, "c2")));

        List<User> result = userService.list("tenant1", "STUDENT", "c1");

        assertEquals(1, result.size());
        assertEquals("Ada", result.get(0).getName());
    }

    @Test
    void list_AStudentInSeveralClasses_AppearsUnderEachOfThem() {
        when(userRepository.findAllByTenantIdAndRole("tenant1", "STUDENT")).thenReturn(List.of(
                person("u1", "tenant1", "Ada", Role.STUDENT, "c1,c2"),
                person("u2", "tenant1", "Bola", Role.STUDENT, "c2")));

        assertEquals(1, userService.list("tenant1", "STUDENT", "c1").size());
        assertEquals(2, userService.list("tenant1", "STUDENT", "c2").size());
    }

    @Test
    void list_ATeacherWithNoClassesIsStillListed() {
        when(userRepository.findAllByTenantIdAndRole("tenant1", "TEACHER"))
                .thenReturn(List.of(person("u1", "tenant1", "Amaka", Role.TEACHER, null)));

        assertEquals(1, userService.list("tenant1", "TEACHER", null).size());
        assertTrue(userService.list("tenant1", "TEACHER", "c1").isEmpty());
    }

    @Test
    void list_UnknownRole_ThrowsException() {
        assertThrows(InvalidRequestException.class, () -> userService.list("tenant1", "PRINCIPAL", null));

        verify(userRepository, never()).findAllByTenantId(any());
    }

    @Test
    void get_UserFromAnotherSchool_IsNotFound() {
        when(userRepository.findById("x1")).thenReturn(Optional.of(person("x1", "other-school", "Eve", Role.STUDENT, null)));

        assertThrows(NotFoundException.class, () -> userService.get("tenant1", "x1"));
    }

    @Test
    void get_UserInTheSameSchool_IsReturned() {
        when(userRepository.findById("1")).thenReturn(Optional.of(user));

        assertSame(user, userService.get("tenant1", "1"));
    }

    @Test
    void remove_Student_Success() {
        when(userRepository.findById("1")).thenReturn(Optional.of(user));

        userService.remove("tenant1", "1");

        verify(userRepository).deleteById("1");
    }

    @Test
    void remove_UserFromAnotherSchool_IsNotFoundAndNothingIsDeleted() {
        when(userRepository.findById("x1")).thenReturn(Optional.of(person("x1", "other-school", "Eve", Role.STUDENT, null)));

        assertThrows(NotFoundException.class, () -> userService.remove("tenant1", "x1"));

        verify(userRepository, never()).deleteById(any());
    }

    @Test
    void remove_Admin_IsRefused() {
        when(userRepository.findById("a1")).thenReturn(Optional.of(person("a1", "tenant1", "Head", Role.ADMIN, null)));

        assertThrows(InvalidRequestException.class, () -> userService.remove("tenant1", "a1"));

        verify(userRepository, never()).deleteById(any());
    }

    @Test
    void remove_TeacherWhoStillHasCourses_IsRefused() {
        when(userRepository.findById("t1")).thenReturn(Optional.of(person("t1", "tenant1", "Amaka", Role.TEACHER, null)));
        when(courseRepository.existsByTeacherId("t1")).thenReturn(true);

        assertThrows(InvalidRequestException.class, () -> userService.remove("tenant1", "t1"));

        verify(userRepository, never()).deleteById(any());
    }

    @Test
    void remove_TeacherWithNoCourses_Success() {
        when(userRepository.findById("t1")).thenReturn(Optional.of(person("t1", "tenant1", "Amaka", Role.TEACHER, null)));
        when(courseRepository.existsByTeacherId("t1")).thenReturn(false);

        userService.remove("tenant1", "t1");

        verify(userRepository).deleteById("t1");
    }

    // --- approving and declining teachers who are waiting ---

    @Test
    void approve_AWaitingTeacher_BecomesApproved() {
        when(userRepository.findById("w1")).thenReturn(Optional.of(waitingTeacher("w1", "tenant1")));
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        User result = userService.approve("tenant1", "w1");

        assertTrue(result.isApproved());
        verify(userRepository).save(result);
    }

    @Test
    void approve_SomeoneFromAnotherSchool_IsNotFoundAndNothingIsSaved() {
        when(userRepository.findById("w1")).thenReturn(Optional.of(waitingTeacher("w1", "other-school")));

        assertThrows(NotFoundException.class, () -> userService.approve("tenant1", "w1"));

        verify(userRepository, never()).save(any());
    }

    @Test
    void approve_ATeacherWhoIsAlreadyApproved_IsRefused() {
        when(userRepository.findById("t1")).thenReturn(Optional.of(person("t1", "tenant1", "Amaka", Role.TEACHER, null)));

        assertThrows(InvalidRequestException.class, () -> userService.approve("tenant1", "t1"));

        verify(userRepository, never()).save(any());
    }

    @Test
    void approve_AStudent_IsRefused() {
        when(userRepository.findById("1")).thenReturn(Optional.of(user));

        assertThrows(InvalidRequestException.class, () -> userService.approve("tenant1", "1"));
    }

    @Test
    void decline_AWaitingTeacher_DeletesTheRequest() {
        when(userRepository.findById("w1")).thenReturn(Optional.of(waitingTeacher("w1", "tenant1")));

        userService.decline("tenant1", "w1");

        verify(userRepository).deleteById("w1");
    }

    @Test
    void decline_SomeoneFromAnotherSchool_IsNotFoundAndNothingIsDeleted() {
        when(userRepository.findById("w1")).thenReturn(Optional.of(waitingTeacher("w1", "other-school")));

        assertThrows(NotFoundException.class, () -> userService.decline("tenant1", "w1"));

        verify(userRepository, never()).deleteById(any());
    }

    @Test
    void decline_AnApprovedTeacher_IsRefusedAndNothingIsDeleted() {
        when(userRepository.findById("t1")).thenReturn(Optional.of(person("t1", "tenant1", "Amaka", Role.TEACHER, null)));

        assertThrows(InvalidRequestException.class, () -> userService.decline("tenant1", "t1"));

        verify(userRepository, never()).deleteById(any());
    }
}