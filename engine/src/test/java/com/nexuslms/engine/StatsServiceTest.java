package com.nexuslms.engine;

import com.nexuslms.engine.dto.StatsResponse;
import com.nexuslms.engine.repository.CourseRepository;
import com.nexuslms.engine.repository.SchoolClassRepository;
import com.nexuslms.engine.repository.UserRepository;
import com.nexuslms.engine.service.StatsService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class StatsServiceTest {

    @Mock SchoolClassRepository classRepository;
    @Mock UserRepository userRepository;
    @Mock CourseRepository courseRepository;
    @InjectMocks StatsService service;

    @Test
    void forSchool_ReturnsEachCountInItsOwnField() {
        when(classRepository.countByTenantId("t1")).thenReturn(3L);
        when(userRepository.countByTenantIdAndRoleAndApproved("t1", "TEACHER")).thenReturn(5L);
        when(userRepository.countByTenantIdAndRoleAndNotApproved("t1", "TEACHER")).thenReturn(2L);
        when(userRepository.countByTenantIdAndRole("t1", "STUDENT")).thenReturn(40L);
        when(courseRepository.countByTenantId("t1")).thenReturn(12L);

        StatsResponse stats = service.forSchool("t1");

        assertEquals(3, stats.classes());
        assertEquals(5, stats.teachers());
        assertEquals(40, stats.students());
        assertEquals(12, stats.courses());
        assertEquals(2, stats.teachersPending());
    }

    @Test
    void forSchool_ASchoolWithNothingYet_GetsZeros() {
        StatsResponse stats = service.forSchool("brand-new");

        assertEquals(new StatsResponse(0, 0, 0, 0, 0), stats);
    }

    @Test
    void forSchool_NeverCountsAnotherSchool() {
        when(classRepository.countByTenantId("t1")).thenReturn(3L);
        when(classRepository.countByTenantId("t2")).thenReturn(99L);

        StatsResponse stats = service.forSchool("t1");

        assertEquals(3, stats.classes());
        verify(classRepository, never()).countByTenantId("t2");
        verify(courseRepository, never()).countByTenantId("t2");
        verify(userRepository, never()).countByTenantIdAndRoleAndApproved("t2", "TEACHER");
        verify(userRepository, never()).countByTenantIdAndRoleAndNotApproved("t2", "TEACHER");
        verify(userRepository, never()).countByTenantIdAndRole("t2", "STUDENT");
    }
}