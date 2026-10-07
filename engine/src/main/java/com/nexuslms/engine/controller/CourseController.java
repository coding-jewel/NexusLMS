package com.nexuslms.engine.controller;

import com.nexuslms.engine.dto.CourseRequest;
import com.nexuslms.engine.dto.CourseResponse;
import com.nexuslms.engine.security.AuthUser;
import com.nexuslms.engine.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping
    public ResponseEntity<CourseResponse> create(@Valid @RequestBody CourseRequest request, @AuthenticationPrincipal AuthUser auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.create(auth, request));
    }

    // Everyone signed in can ask. The service decides what each role gets back.
    @GetMapping
    public List<CourseResponse> list(@AuthenticationPrincipal AuthUser auth) {
        return courseService.list(auth);
    }

    @GetMapping("/{id}")
    public CourseResponse get(@PathVariable String id, @AuthenticationPrincipal AuthUser auth) {
        return courseService.get(auth, id);
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PatchMapping("/{id}/publish")
    public CourseResponse publish(@PathVariable String id, @AuthenticationPrincipal AuthUser auth) {
        return courseService.publish(auth, id);
    }

    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, @AuthenticationPrincipal AuthUser auth) {
        courseService.delete(auth, id);
        return ResponseEntity.noContent().build();
    }
}