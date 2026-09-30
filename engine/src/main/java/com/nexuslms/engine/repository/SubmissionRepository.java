package com.nexuslms.engine.repository;

import com.nexuslms.engine.models.Submission;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends MongoRepository<Submission, String> {

    @Query("{ 'assignmentId': ?0 }")
    List<Submission> findAllByAssignmentId(String assignmentId);

    @Query("{ 'studentId': ?0 }")
    List<Submission> findAllByStudentId(String studentId);

    @Query("{ 'assignmentId': ?0, 'studentId': ?1 }")
    Optional<Submission> findByAssignmentIdAndStudentId(String assignmentId, String studentId);

    @Query(value = "{ 'assignmentId': ?0, 'studentId': ?1 }", exists = true)
    boolean existsByAssignmentIdAndStudentId(String assignmentId, String studentId);

    @Query("{ 'assignmentId': ?0, 'graded': false }")
    List<Submission> findAllUngradedByAssignmentId(String assignmentId);
}