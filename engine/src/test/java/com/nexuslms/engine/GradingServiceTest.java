package com.nexuslms.engine;

import com.nexuslms.engine.dto.GradingWeightsRequest;
import com.nexuslms.engine.exception.InvalidRequestException;
import com.nexuslms.engine.exception.NotFoundException;
import com.nexuslms.engine.models.GradingWeights;
import com.nexuslms.engine.models.Tenant;
import com.nexuslms.engine.repository.TenantRepository;
import com.nexuslms.engine.service.GradingService;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class GradingServiceTest {

    @Mock TenantRepository tenantRepository;
    @InjectMocks GradingService service;

    private Tenant tenant(GradingWeights weights) {
        Tenant t = new Tenant();
        t.setId("t1");
        t.setName("Lincoln");
        t.setGradingWeights(weights);
        return t;
    }

    @Test
    void aSchoolWithNoSavedWeightsGetsTheDefaults() {
        when(tenantRepository.findById("t1")).thenReturn(Optional.of(tenant(null)));

        assertEquals(new GradingWeights(20, 20, 60), service.get("t1"));
    }

    @Test
    void returnsTheSavedWeights() {
        when(tenantRepository.findById("t1")).thenReturn(Optional.of(tenant(new GradingWeights(10, 30, 60))));

        assertEquals(new GradingWeights(10, 30, 60), service.get("t1"));
    }

    @Test
    void savesValidWeightsOnTheCallersSchool() {
        when(tenantRepository.findById("t1")).thenReturn(Optional.of(tenant(null)));

        GradingWeights saved = service.save("t1", new GradingWeightsRequest(10, 30, 60));

        ArgumentCaptor<Tenant> captor = ArgumentCaptor.forClass(Tenant.class);
        verify(tenantRepository).save(captor.capture());
        assertEquals(new GradingWeights(10, 30, 60), captor.getValue().getGradingWeights());
        assertEquals(new GradingWeights(10, 30, 60), saved);
    }

    @Test
    void assignmentsCanBeSavedAsZero() {
        when(tenantRepository.findById("t1")).thenReturn(Optional.of(tenant(null)));

        assertEquals(new GradingWeights(0, 40, 60), service.save("t1", new GradingWeightsRequest(0, 40, 60)));
    }

    @Test
    void refusesInvalidWeightsAndSavesNothing() {
        assertThrows(InvalidRequestException.class, () -> service.save("t1", new GradingWeightsRequest(20, 10, 70)));
        assertThrows(InvalidRequestException.class, () -> service.save("t1", new GradingWeightsRequest(40, 20, 30)));
        assertThrows(InvalidRequestException.class, () -> service.save("t1", new GradingWeightsRequest(20, 20, 50)));
        verify(tenantRepository, never()).save(any());
    }

    @Test
    void anUnknownSchoolIsNotFound() {
        when(tenantRepository.findById("nope")).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.get("nope"));
    }
}