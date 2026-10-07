package com.nexuslms.engine;

import com.nexuslms.engine.exception.NotFoundException;
import com.nexuslms.engine.models.Tenant;
import com.nexuslms.engine.repository.TenantRepository;
import com.nexuslms.engine.service.TeacherCodeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TeacherCodeServiceTest {

    @Mock TenantRepository tenantRepository;
    @InjectMocks TeacherCodeService service;

    private Tenant tenant;

    @BeforeEach
    void setUp() {
        tenant = new Tenant();
        tenant.setId("t1");
        tenant.setName("Lincoln High School");
        when(tenantRepository.findById("t1")).thenReturn(Optional.of(tenant));
        when(tenantRepository.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void get_ASchoolWithoutACode_GetsOneAndItIsSaved() {
        String code = service.get("t1");

        assertTrue(code.startsWith("STAFF-"));
        ArgumentCaptor<Tenant> captor = ArgumentCaptor.forClass(Tenant.class);
        verify(tenantRepository).save(captor.capture());
        assertEquals(code, captor.getValue().getTeacherCode());
    }

    @Test
    void get_ASchoolThatAlreadyHasACode_KeepsIt() {
        tenant.setTeacherCode("STAFF-ABC234");

        assertEquals("STAFF-ABC234", service.get("t1"));

        verify(tenantRepository, never()).save(any());
    }

    @Test
    void regenerate_ReplacesTheOldCode() {
        tenant.setTeacherCode("STAFF-ABC234");

        String fresh = service.regenerate("t1");

        assertNotEquals("STAFF-ABC234", fresh);
        assertEquals(fresh, tenant.getTeacherCode());
        verify(tenantRepository).save(tenant);
    }

    @Test
    void aCodeAnotherSchoolAlreadyHas_IsSkipped() {
        when(tenantRepository.existsByTeacherCode(anyString())).thenReturn(true).thenReturn(false);

        String code = service.get("t1");

        assertEquals(code, tenant.getTeacherCode());
        verify(tenantRepository, times(2)).existsByTeacherCode(anyString());
        verify(tenantRepository, times(1)).save(any());
    }

    @Test
    void givesUpWhenEveryCodeIsTaken_AndSavesNothing() {
        when(tenantRepository.existsByTeacherCode(anyString())).thenReturn(true);

        assertThrows(IllegalStateException.class, () -> service.regenerate("t1"));

        verify(tenantRepository, never()).save(any());
    }

    @Test
    void anUnknownSchool_IsNotFound() {
        when(tenantRepository.findById("nope")).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.get("nope"));
        assertThrows(NotFoundException.class, () -> service.regenerate("nope"));
    }
}