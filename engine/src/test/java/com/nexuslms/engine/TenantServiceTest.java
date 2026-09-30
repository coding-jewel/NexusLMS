package com.nexuslms.engine;

import com.nexuslms.engine.exception.DuplicateResourceException;
import com.nexuslms.engine.models.Tenant;
import com.nexuslms.engine.repository.TenantRepository;
import com.nexuslms.engine.service.TenantService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TenantServiceTest {

    @Mock
    private TenantRepository tenantRepository;

    @InjectMocks
    private TenantService tenantService;

    private Tenant tenant;

    @BeforeEach
    void setUp() {
        tenant = new Tenant();
        tenant.setId("1");
        tenant.setName("Lincoln High School");
        tenant.setSubdomain("lincoln");
        tenant.setActive(true);
    }

    @Test
    void createTenant_Success() {
        when(tenantRepository.existsBySubdomain("lincoln")).thenReturn(false);
        when(tenantRepository.save(tenant)).thenReturn(tenant);

        Tenant result = tenantService.createTenant(tenant);

        assertNotNull(result);
        assertEquals("Lincoln High School", result.getName());
        assertEquals("lincoln", result.getSubdomain());
        verify(tenantRepository, times(1)).save(tenant);
    }

    @Test
    void createTenant_DuplicateSubdomain_ThrowsException() {
        when(tenantRepository.existsBySubdomain("lincoln")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> {
            tenantService.createTenant(tenant);
        });

        verify(tenantRepository, never()).save(any());
    }

    @Test
    void getTenantById_Found() {
        when(tenantRepository.findById("1")).thenReturn(Optional.of(tenant));

        Optional<Tenant> result = tenantService.getTenantById("1");

        assertTrue(result.isPresent());
        assertEquals("lincoln", result.get().getSubdomain());
    }

    @Test
    void getTenantById_NotFound() {
        when(tenantRepository.findById("999")).thenReturn(Optional.empty());

        Optional<Tenant> result = tenantService.getTenantById("999");

        assertFalse(result.isPresent());
    }
}