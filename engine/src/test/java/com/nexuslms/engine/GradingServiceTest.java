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
        assertEquals(new GradingWeights(40, 60), service.get("t1"));
    }

    @Test
    void returnsTheSavedWeights() {
        when(tenantRepository.findById("t1")).thenReturn(Optional.of(tenant(new GradingWeights(30, 70))));
        assertEquals(new GradingWeights(30, 70), service.get("t1"));
    }

    @Test
    void savesValidWeightsOnTheCallersSchool() {
        when(tenantRepository.findById("t1")).thenReturn(Optional.of(tenant(null)));

        GradingWeights saved = service.save("t1", new GradingWeightsRequest(30, 70));

        ArgumentCaptor<Tenant> captor = ArgumentCaptor.forClass(Tenant.class);
        verify(tenantRepository).save(captor.capture());
        assertEquals(new GradingWeights(30, 70), captor.getValue().getGradingWeights());
        assertEquals(new GradingWeights(30, 70), saved);
    }

    @Test
    void refusesInvalidWeightsAndSavesNothing() {
        assertThrows(InvalidRequestException.class, () -> service.save("t1", new GradingWeightsRequest(10, 90)));
        assertThrows(InvalidRequestException.class, () -> service.save("t1", new GradingWeightsRequest(60, 30)));
        assertThrows(InvalidRequestException.class, () -> service.save("t1", new GradingWeightsRequest(20, 40)));
        verify(tenantRepository, never()).save(any());
    }

    @Test
    void anUnknownSchoolIsNotFound() {
        when(tenantRepository.findById("nope")).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> service.get("nope"));
    }
}