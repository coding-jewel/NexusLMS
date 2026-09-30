package com.nexuslms.engine.service;

import com.nexuslms.engine.exception.DuplicateResourceException;
import com.nexuslms.engine.models.Course;
import com.nexuslms.engine.repository.CourseRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CourseService {

    private final CourseRepository courseRepository;

    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    public Course createCourse(Course course) {
        if (courseRepository.existsByTitleAndClassId(
                course.getTitle(), course.getClassId())) {
            throw new DuplicateResourceException("A course with this title already exists in this class");
        }
        return courseRepository.save(course);
    }

    public List<Course> getAllCoursesByTenant(String tenantId) {
        return courseRepository.findAllByTenantId(tenantId);
    }

    public List<Course> getAllCoursesByClass(String classId) {
        return courseRepository.findAllByClassId(classId);
    }

    public List<Course> getAllCoursesByTeacher(String teacherId) {
        return courseRepository.findAllByTeacherId(teacherId);
    }

    public Optional<Course> getCourseById(String id) {
        return courseRepository.findById(id);
    }

    public Course publishCourse(String id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        course.setPublished(true);
        return courseRepository.save(course);
    }

    public void deleteCourse(String id) {
        courseRepository.deleteById(id);
    }
}