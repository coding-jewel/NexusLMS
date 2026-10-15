package com.nexuslms.engine.repository;

import com.nexuslms.engine.models.Quiz;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizRepository extends MongoRepository<Quiz, String> {

    // --- topic-level quizzes ---

    @Query("{ 'courseId': ?0, 'category': 'QUIZ' }")
    List<Quiz> findAllQuizzesByCourseId(String courseId);

    @Query("{ 'courseId': ?0, 'category': 'QUIZ', 'published': true }")
    List<Quiz> findPublishedQuizzesByCourseId(String courseId);

    @Query(value = "{ 'courseId': ?0, 'category': 'QUIZ' }", count = true)
    long countQuizzesByCourseId(String courseId);

    @Query(value = "{ 'courseId': ?0, 'category': 'QUIZ' }", exists = true)
    boolean existsQuizByCourseId(String courseId);

    // --- class-level tests and exams ---

    @Query("{ 'classId': ?0, 'category': ?1 }")
    List<Quiz> findAllByClassIdAndCategory(String classId, String category);

    @Query("{ 'classId': ?0, 'category': ?1, 'published': true }")
    List<Quiz> findPublishedByClassIdAndCategory(String classId, String category);

    @Query(value = "{ 'classId': ?0, 'category': ?1 }", count = true)
    long countByClassIdAndCategory(String classId, String category);

    // --- teacher views ---

    @Query("{ 'teacherId': ?0, 'category': ?1 }")
    List<Quiz> findAllByTeacherIdAndCategory(String teacherId, String category);

    @Query("{ 'teacherId': ?0, 'category': { $in: ['TEST', 'EXAM'] } }")
    List<Quiz> findAllTestsAndExamsByTeacherId(String teacherId);

    // --- tenant-wide ---

    @Query("{ 'tenantId': ?0, 'category': ?1 }")
    List<Quiz> findAllByTenantIdAndCategory(String tenantId, String category);

    @Query("{ '_id': ?0 }")
    Optional<Quiz> findById(String id);
}