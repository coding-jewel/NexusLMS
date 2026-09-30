package com.nexuslms.engine.controller;

import com.nexuslms.engine.models.Course;
import com.nexuslms.engine.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Course> createCourse(@Valid @RequestBody Course course) {
        Course created = courseService.createCourse(course);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<Course>> getAllCoursesByTenant(@PathVariable String tenantId) {
        return ResponseEntity.ok(courseService.getAllCoursesByTenant(tenantId));
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<Course>> getAllCoursesByClass(@PathVariable String classId) {
        return ResponseEntity.ok(courseService.getAllCoursesByClass(classId));
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<Course>> getAllCoursesByTeacher(@PathVariable String teacherId) {
        return ResponseEntity.ok(courseService.getAllCoursesByTeacher(teacherId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Course> getCourseById(@PathVariable String id) {
        return courseService.getCourseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    @PatchMapping("/{id}/publish")
    public ResponseEntity<Course> publishCourse(@PathVariable String id) {
        Course published = courseService.publishCourse(id);
        return ResponseEntity.ok(published);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable String id) {
        courseService.deleteCourse(id);
        return ResponseEntity.noContent().build();
    }
}