package com.nexuslms.engine.controller;

import com.nexuslms.engine.security.AuthUser;
import com.nexuslms.engine.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/clear-data")
    public ResponseEntity<Void> clearData(@AuthenticationPrincipal AuthUser auth) {
        adminService.clearData(auth);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/school")
    public ResponseEntity<Void> deleteSchool(@AuthenticationPrincipal AuthUser auth) {
        adminService.deleteSchool(auth);
        return ResponseEntity.ok().build();
    }
}