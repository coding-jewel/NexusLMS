package com.nexuslms.engine.controller;

import com.nexuslms.engine.models.Tenant;
import com.nexuslms.engine.security.AuthUser;
import com.nexuslms.engine.service.TenantService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tenants")
public class TenantController {
    private final TenantService tenantService;

    public TenantController(TenantService tenantService) {
        this.tenantService = tenantService;
    }

    // You can only read your own school.
    @GetMapping("/{id}")
    public ResponseEntity<Tenant> getTenantById(@PathVariable String id, @AuthenticationPrincipal AuthUser auth) {
        if (!id.equals(auth.tenantId())) {
            return ResponseEntity.notFound().build();
        }
        return tenantService.getTenantById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}