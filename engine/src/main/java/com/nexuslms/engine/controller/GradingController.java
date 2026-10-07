package com.nexuslms.engine.controller;

import com.nexuslms.engine.dto.GradingWeightsRequest;
import com.nexuslms.engine.models.GradingWeights;
import com.nexuslms.engine.security.AuthUser;
import com.nexuslms.engine.service.GradingService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/grading")
public class GradingController {
    private final GradingService gradingService;

    public GradingController(GradingService gradingService) {
        this.gradingService = gradingService;
    }

    // Teachers need the weights for the gradebook. Students never see them.
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping("/weights")
    public GradingWeights get(@AuthenticationPrincipal AuthUser auth) {
        return gradingService.get(auth.tenantId());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/weights")
    public GradingWeights save(@Valid @RequestBody GradingWeightsRequest request, @AuthenticationPrincipal AuthUser auth) {
        return gradingService.save(auth.tenantId(), request);
    }
}