package com.nexuslms.engine.controller;

import com.nexuslms.engine.dto.StatsResponse;
import com.nexuslms.engine.security.AuthUser;
import com.nexuslms.engine.service.StatsService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/stats")
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    // The school comes from the signed-in admin's token, never from the request.
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public StatsResponse stats(@AuthenticationPrincipal AuthUser auth) {
        return statsService.forSchool(auth.tenantId());
    }
}