package com.nexuslms.engine.controller;

import com.nexuslms.engine.models.SchoolClass;
import com.nexuslms.engine.service.SchoolClassService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
public class SchoolClassController {

    private final SchoolClassService schoolClassService;

    public SchoolClassController(SchoolClassService schoolClassService) {
        this.schoolClassService = schoolClassService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<SchoolClass> createClass(@Valid @RequestBody SchoolClass schoolClass) {
        SchoolClass created = schoolClassService.createClass(schoolClass);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<SchoolClass>> getAllClassesByTenant(@PathVariable String tenantId) {
        return ResponseEntity.ok(schoolClassService.getAllClassesByTenant(tenantId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SchoolClass> getClassById(@PathVariable String id) {
        return schoolClassService.getClassById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClass(@PathVariable String id) {
        schoolClassService.deleteClass(id);
        return ResponseEntity.noContent().build();
    }
}