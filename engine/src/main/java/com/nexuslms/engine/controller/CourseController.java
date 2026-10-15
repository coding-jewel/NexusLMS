package com.nexuslms.engine.controller;

import com.nexuslms.engine.dto.CoursePeopleResponse;
import com.nexuslms.engine.dto.CourseRequest;
import com.nexuslms.engine.dto.CourseResponse;
import com.nexuslms.engine.security.AuthUser;
import com.nexuslms.engine.service.CloudinaryService;
import com.nexuslms.engine.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;
    private final CloudinaryService cloudinaryService;

    public CourseController(CourseService courseService, CloudinaryService cloudinaryService) {
        this.courseService = courseService;
        this.cloudinaryService = cloudinaryService;
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping
    public ResponseEntity<CourseResponse> create(@Valid @RequestBody CourseRequest request,
                                                 @AuthenticationPrincipal AuthUser auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.create(auth, request));
    }

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
    @PatchMapping("/{id}/unpublish")
    public CourseResponse unpublish(@PathVariable String id, @AuthenticationPrincipal AuthUser auth) {
        return courseService.unpublish(auth, id);
    }

    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, @AuthenticationPrincipal AuthUser auth) {
        courseService.delete(auth, id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping("/{id}/attachments")
    public ResponseEntity<CourseResponse> attach(@PathVariable String id,
                                                 @RequestParam("file") MultipartFile file,
                                                 @AuthenticationPrincipal AuthUser auth) {
        try {
            String url = cloudinaryService.uploadFile(file, "courses");
            return ResponseEntity.ok(courseService.attachFile(auth, id, url));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/{id}/attachments")
    public CourseResponse detach(@PathVariable String id,
                                 @RequestParam("url") String url,
                                 @AuthenticationPrincipal AuthUser auth) {
        return courseService.detachFile(auth, id, url);
    }

    @GetMapping("/{id}/people")
    public CoursePeopleResponse people(@PathVariable String id, @AuthenticationPrincipal AuthUser auth) {
        return courseService.people(auth, id);
    }
}