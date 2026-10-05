package com.nexuslms.engine.controller;

import com.nexuslms.engine.dto.AvailabilityResponse;
import com.nexuslms.engine.dto.PendingRegistrationResponse;
import com.nexuslms.engine.dto.PublicTenantResponse;
import com.nexuslms.engine.dto.RegisterSchoolRequest;
import com.nexuslms.engine.dto.RegistrationResponse;
import com.nexuslms.engine.dto.ResendRequest;
import com.nexuslms.engine.dto.VerifyRegistrationRequest;
import com.nexuslms.engine.models.Tenant;
import com.nexuslms.engine.service.RegistrationService;
import com.nexuslms.engine.service.SubdomainRules;
import com.nexuslms.engine.service.TenantService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Everything here works without signing in. Keep it small and never return more than the page needs.
@RestController
@RequestMapping("/api/public")
public class PublicController {
    private final TenantService tenantService;
    private final RegistrationService registrationService;

    public PublicController(TenantService tenantService, RegistrationService registrationService) {
        this.tenantService = tenantService;
        this.registrationService = registrationService;
    }

    @GetMapping("/tenants/{subdomain}")
    public ResponseEntity<PublicTenantResponse> tenant(@PathVariable String subdomain) {
        return tenantService.getTenantBySubdomain(SubdomainRules.normalize(subdomain))
                .filter(Tenant::isActive)
                .map(t -> ResponseEntity.ok(new PublicTenantResponse(t.getName(), t.getSubdomain())))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/subdomains/{subdomain}/available")
    public AvailabilityResponse available(@PathVariable String subdomain) {
        return registrationService.availability(subdomain);
    }

    // step 1: emails a code and creates nothing yet
    @PostMapping("/registrations")
    public ResponseEntity<PendingRegistrationResponse> start(@Valid @RequestBody RegisterSchoolRequest request) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(registrationService.start(request));
    }

    // step 2: a right code creates the school and its admin
    @PostMapping("/registrations/verify")
    public ResponseEntity<RegistrationResponse> verify(@Valid @RequestBody VerifyRegistrationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(registrationService.verify(request));
    }

    @PostMapping("/registrations/resend")
    public ResponseEntity<PendingRegistrationResponse> resend(@Valid @RequestBody ResendRequest request) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(registrationService.resend(request));
    }
}