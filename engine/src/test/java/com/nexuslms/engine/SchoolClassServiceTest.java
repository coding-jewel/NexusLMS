package com.nexuslms.engine;

import com.nexuslms.engine.dto.ClassRequest;
import com.nexuslms.engine.dto.ClassResponse;
import com.nexuslms.engine.exception.DuplicateResourceException;
import com.nexuslms.engine.exception.InvalidRequestException;
import com.nexuslms.engine.exception.NotFoundException;
import com.nexuslms.engine.models.Role;
import com.nexuslms.engine.models.SchoolClass;
import com.nexuslms.engine.models.User;
import com.nexuslms.engine.repository.SchoolClassRepository;
import com.nexuslms.engine.repository.UserRepository;
import com.nexuslms.engine.service.SchoolClassService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SchoolClassServiceTest {

    private static final String CODE_FORMAT = "^[A-Z]{3}-[A-HJ-NP-Z2-9]{4}$";

    @Mock SchoolClassRepository classRepository;
    @Mock UserRepository userRepository;
    @InjectMocks SchoolClassService service;

    @BeforeEach
    void setUp() {
        when(classRepository.save(any())).thenAnswer(i -> {
            SchoolClass c = i.getArgument(0);
            if (c.getId() == null) {
                c.setId("c1");
            }
            return c;
        });
        // default: no teachers, no students, until a test overrides
        when(userRepository.findTeachersInClass(anyString(), anyString())).thenReturn(List.of());
        when(userRepository.countStudentsInClass(anyString())).thenReturn(0L);
    }

    private SchoolClass existing(String tenantId, String name) {
        SchoolClass c = new SchoolClass();
        c.setId("c1");
        c.setTenantId(tenantId);
        c.setName(name);
        c.setCode("OLD-AAAA");
        return c;
    }

    private User teacher(String id, String tenantId, String... classIds) {
        User u = new User();
        u.setId(id);
        u.setTenantId(tenantId);
        u.setName("Mr Bello");
        u.setEmail(id + "@lincoln.edu");
        u.setPassword("hash");
        u.setRole(Role.TEACHER);
        u.setClassIds(new ArrayList<>(List.of(classIds)));
        return u;
    }

    @Test
    void createsAClassInTheCallersSchoolWithACode() {
        ClassResponse created = service.create("t1", new ClassRequest("  JSS 1 Gold ", " First year "));

        assertEquals("JSS 1 Gold", created.name());
        assertEquals("First year", created.description());
        assertTrue(created.code().matches(CODE_FORMAT));
        assertEquals(0, created.teacherIds().size());
        assertEquals(0, created.studentCount());
    }

    @Test
    void rejectsADuplicateNameInTheSameSchool() {
        when(classRepository.existsByNameAndTenantId("JSS 1 Gold", "t1")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> service.create("t1", new ClassRequest("JSS 1 Gold", null)));
        verify(classRepository, never()).save(any());
    }

    @Test
    void triesAnotherCodeWhenOneIsAlreadyUsed() {
        when(classRepository.existsByCode(anyString())).thenReturn(true, false);

        ClassResponse created = service.create("t1", new ClassRequest("JSS 1 Gold", null));

        assertTrue(created.code().matches(CODE_FORMAT));
        verify(classRepository, times(2)).existsByCode(anyString());
        verify(classRepository, times(1)).save(any());
    }

    @Test
    void listsClassesByNameWithoutCaringAboutCase() {
        when(classRepository.findAllByTenantId("t1")).thenReturn(List.of(
                existing("t1", "ss 2 Arts"), existing("t1", "JSS 1 Gold"), existing("t1", "Coding Club")));

        List<String> names = service.list("t1").stream().map(ClassResponse::name).toList();

        assertEquals(List.of("Coding Club", "JSS 1 Gold", "ss 2 Arts"), names);
    }

    @Test
    void list_ShowsTeacherAndStudentCounts() {
        SchoolClass c = existing("t1", "JSS 1 Gold");
        when(classRepository.findAllByTenantId("t1")).thenReturn(List.of(c));
        when(userRepository.findTeachersInClass("t1", "c1"))
                .thenReturn(List.of(teacher("t-a", "t1", "c1"), teacher("t-b", "t1", "c1")));
        when(userRepository.countStudentsInClass("c1")).thenReturn(41L);

        ClassResponse r = service.list("t1").get(0);

        assertEquals(2, r.teacherIds().size());
        assertEquals(41, r.studentCount());
    }

    @Test
    void regeneratingGivesTheClassAFreshCode() {
        when(classRepository.findById("c1")).thenReturn(Optional.of(existing("t1", "JSS 1 Gold")));

        ClassResponse updated = service.regenerateCode("t1", "c1");

        assertTrue(updated.code().matches(CODE_FORMAT));
        verify(classRepository).save(any());
    }

    @Test
    void regeneratingAnotherSchoolsClassLooksLikeItDoesNotExist() {
        when(classRepository.findById("c1")).thenReturn(Optional.of(existing("t2", "JSS 1 Gold")));

        assertThrows(NotFoundException.class, () -> service.regenerateCode("t1", "c1"));
        verify(classRepository, never()).save(any());
    }

    @Test
    void deletesAnEmptyClass() {
        when(classRepository.findById("c1")).thenReturn(Optional.of(existing("t1", "JSS 1 Gold")));

        service.delete("t1", "c1");

        verify(classRepository).deleteById("c1");
    }

    @Test
    void refusesToDeleteAClassThatStillHasStudents() {
        when(classRepository.findById("c1")).thenReturn(Optional.of(existing("t1", "JSS 1 Gold")));
        when(userRepository.existsByClassId("c1")).thenReturn(true);

        assertThrows(InvalidRequestException.class, () -> service.delete("t1", "c1"));
        verify(classRepository, never()).deleteById(anyString());
    }

    @Test
    void refusesToDeleteAnotherSchoolsClass() {
        when(classRepository.findById("c1")).thenReturn(Optional.of(existing("t2", "JSS 1 Gold")));

        assertThrows(NotFoundException.class, () -> service.delete("t1", "c1"));
        verify(classRepository, never()).deleteById(anyString());
    }

    // --- assign / remove teachers ---

    @Test
    void assignTeacher_AddsTheClassToTheTeacher() {
        SchoolClass c = existing("t1", "JSS 1 Gold");
        when(classRepository.findById("c1")).thenReturn(Optional.of(c));
        User t = teacher("t-a", "t1");
        when(userRepository.findById("t-a")).thenReturn(Optional.of(t));

        ClassResponse r = service.assignTeacher("t1", "c1", "t-a");

        assertTrue(t.getClassIds().contains("c1"));
        verify(userRepository).save(t);
        assertEquals("JSS 1 Gold", r.name());
    }

    @Test
    void assignTeacher_IsIdempotent() {
        SchoolClass c = existing("t1", "JSS 1 Gold");
        when(classRepository.findById("c1")).thenReturn(Optional.of(c));
        User t = teacher("t-a", "t1", "c1");
        when(userRepository.findById("t-a")).thenReturn(Optional.of(t));

        service.assignTeacher("t1", "c1", "t-a");

        verify(userRepository, never()).save(any());
    }

    @Test
    void assignTeacher_WithSomeoneFromAnotherSchool_IsNotFound() {
        when(classRepository.findById("c1")).thenReturn(Optional.of(existing("t1", "JSS 1 Gold")));
        when(userRepository.findById("t-a")).thenReturn(Optional.of(teacher("t-a", "other-school")));

        assertThrows(NotFoundException.class, () -> service.assignTeacher("t1", "c1", "t-a"));
        verify(userRepository, never()).save(any());
    }

    @Test
    void assignTeacher_WithAStudent_IsNotFound() {
        when(classRepository.findById("c1")).thenReturn(Optional.of(existing("t1", "JSS 1 Gold")));
        User student = teacher("s1", "t1");
        student.setRole(Role.STUDENT);
        when(userRepository.findById("s1")).thenReturn(Optional.of(student));

        assertThrows(NotFoundException.class, () -> service.assignTeacher("t1", "c1", "s1"));
    }

    @Test
    void removeTeacher_RemovesTheClassFromTheTeacher() {
        when(classRepository.findById("c1")).thenReturn(Optional.of(existing("t1", "JSS 1 Gold")));
        User t = teacher("t-a", "t1", "c1", "c2");
        when(userRepository.findById("t-a")).thenReturn(Optional.of(t));

        service.removeTeacher("t1", "c1", "t-a");

        assertFalse(t.getClassIds().contains("c1"));
        assertTrue(t.getClassIds().contains("c2"));
        verify(userRepository).save(t);
    }

    @Test
    void removeTeacher_WhenNotAssigned_IsANoOp() {
        when(classRepository.findById("c1")).thenReturn(Optional.of(existing("t1", "JSS 1 Gold")));
        User t = teacher("t-a", "t1");
        when(userRepository.findById("t-a")).thenReturn(Optional.of(t));

        service.removeTeacher("t1", "c1", "t-a");

        verify(userRepository, never()).save(any());
    }

    @Test
    void removeTeacher_FromAnotherSchool_IsNotFound() {
        when(classRepository.findById("c1")).thenReturn(Optional.of(existing("t1", "JSS 1 Gold")));
        when(userRepository.findById("t-a")).thenReturn(Optional.of(teacher("t-a", "other-school", "c1")));

        assertThrows(NotFoundException.class, () -> service.removeTeacher("t1", "c1", "t-a"));
    }
}