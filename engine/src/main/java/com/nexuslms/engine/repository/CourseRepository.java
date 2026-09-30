package com.nexuslms.engine.repository;

import com.nexuslms.engine.models.Course;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends MongoRepository<Course, String> {

    @Query("{ 'tenantId': ?0 }")
    List<Course> findAllByTenantId(String tenantId);

    @Query("{ 'classId': ?0 }")
    List<Course> findAllByClassId(String classId);

    @Query("{ 'teacherId': ?0 }")
    List<Course> findAllByTeacherId(String teacherId);

    @Query(value = "{ 'title': ?0, 'classId': ?1 }", exists = true)
    boolean existsByTitleAndClassId(String title, String classId);
}