package com.nexuslms.engine.repository;

import com.nexuslms.engine.models.Quiz;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizRepository extends MongoRepository<Quiz, String> {

    @Query("{ 'courseId': ?0 }")
    List<Quiz> findAllByCourseId(String courseId);

    @Query("{ 'tenantId': ?0 }")
    List<Quiz> findAllByTenantId(String tenantId);

    @Query("{ 'teacherId': ?0 }")
    List<Quiz> findAllByTeacherId(String teacherId);

    @Query("{ 'courseId': ?0, 'published': true }")
    List<Quiz> findAllPublishedByCourseId(String courseId);

    @Query("{ '_id': ?0 }")
    Optional<Quiz> findById(String id);

    @Query(value = "{ 'courseId': ?0 }", exists = true)
    boolean existsByCourseId(String courseId);
}