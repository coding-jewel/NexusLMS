package com.nexuslms.engine.repository;

import com.nexuslms.engine.models.Assignment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends MongoRepository<Assignment, String> {

    @Query("{ 'courseId': ?0 }")
    List<Assignment> findAllByCourseId(String courseId);

    @Query("{ 'tenantId': ?0 }")
    List<Assignment> findAllByTenantId(String tenantId);

    @Query("{ 'teacherId': ?0 }")
    List<Assignment> findAllByTeacherId(String teacherId);
}