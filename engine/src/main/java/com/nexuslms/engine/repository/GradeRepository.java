package com.nexuslms.engine.repository;

import com.nexuslms.engine.models.Grade;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GradeRepository extends MongoRepository<Grade, String> {

    @Query("{ 'studentId': ?0, 'courseId': ?1 }")
    List<Grade> findAllByStudentIdAndCourseId(String studentId, String courseId);

    @Query("{ 'studentId': ?0 }")
    List<Grade> findAllByStudentId(String studentId);

    @Query("{ 'courseId': ?0 }")
    List<Grade> findAllByCourseId(String courseId);

    @Query("{ 'classId': ?0 }")
    List<Grade> findAllByClassId(String classId);

    @Query("{ 'assignmentId': ?0, 'studentId': ?1 }")
    Optional<Grade> findByAssignmentIdAndStudentId(String assignmentId, String studentId);

    @Query("{ 'quizId': ?0, 'studentId': ?1 }")
    Optional<Grade> findByQuizIdAndStudentId(String quizId, String studentId);

    @Query("{ 'tenantId': ?0 }")
    List<Grade> findAllByTenantId(String tenantId);

    // Used by the gradebook to fetch every score for a batch of items in one call.
    @Query("{ 'assignmentId': { $in: ?0 } }")
    List<Grade> findAllByAssignmentIdIn(List<String> assignmentIds);

    @Query("{ 'quizId': { $in: ?0 } }")
    List<Grade> findAllByQuizIdIn(List<String> quizIds);
}