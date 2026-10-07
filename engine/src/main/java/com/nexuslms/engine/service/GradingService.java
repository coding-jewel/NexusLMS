package com.nexuslms.engine.service;

import com.nexuslms.engine.dto.GradingWeightsRequest;
import com.nexuslms.engine.exception.InvalidRequestException;
import com.nexuslms.engine.exception.NotFoundException;
import com.nexuslms.engine.models.GradingWeights;
import com.nexuslms.engine.models.Tenant;
import com.nexuslms.engine.repository.TenantRepository;
import org.springframework.stereotype.Service;

// The school always comes from the signed-in user, never from the request.
@Service
public class GradingService {
    private final TenantRepository tenantRepository;

    public GradingService(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    public GradingWeights get(String tenantId) {
        GradingWeights stored = tenant(tenantId).getGradingWeights();
        return stored != null ? stored : GradingWeights.DEFAULT;
    }

    public GradingWeights save(String tenantId, GradingWeightsRequest request) {
        String problem = GradingRules.problem(request.assignments(), request.tests(), request.exams());
        if (problem != null) {
            throw new InvalidRequestException(problem);
        }
        Tenant tenant = tenant(tenantId);
        GradingWeights weights = new GradingWeights(request.assignments(), request.tests(), request.exams());
        tenant.setGradingWeights(weights);
        tenantRepository.save(tenant);
        return weights;
    }

    private Tenant tenant(String tenantId) {
        return tenantRepository.findById(tenantId).orElseThrow(() -> new NotFoundException("School not found"));
    }
}