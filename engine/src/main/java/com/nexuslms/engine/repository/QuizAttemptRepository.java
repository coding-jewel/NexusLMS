package com.nexuslms.engine.repository;

import com.nexuslms.engine.models.QuizAttempt;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAttemptRepository extends MongoRepository<QuizAttempt, String> {

    @Query("{ 'quizId': ?0 }")
    List<QuizAttempt> findAllByQuizId(String quizId);

    @Query("{ 'studentId': ?0 }")
    List<QuizAttempt> findAllByStudentId(String studentId);

    @Query("{ 'quizId': ?0, 'studentId': ?1 }")
    Optional<QuizAttempt> findByQuizIdAndStudentId(String quizId, String studentId);

    @Query(value = "{ 'quizId': ?0, 'studentId': ?1 }", exists = true)
    boolean existsByQuizIdAndStudentId(String quizId, String studentId);

    @Query(value = "{ 'quizId': ?0 }", exists = true)
    boolean existsByQuizId(String quizId);

    @Query(value = "{ 'quizId': ?0 }", count = true)
    long countByQuizId(String quizId);

    // FIXED: Added 'submitted': true so teachers don't see in-progress attempts
    @Query("{ 'quizId': ?0, 'graded': false, 'submitted': true }")
    List<QuizAttempt> findAllUngradedByQuizId(String quizId);

    // FIXED: Added 'submitted': true for the badge count
    @Query(value = "{ 'quizId': ?0, 'graded': false, 'submitted': true }", count = true)
    long countByQuizIdAndGradedFalse(String quizId);

    // ADDED: Finds all attempts that have not been submitted but whose time is up.
    @Query("{ 'submitted': false, 'expiresAt': { $lt: ?0 } }")
    List<QuizAttempt> findExpiredUnsubmitted(LocalDateTime now);

    // Delete all attempts for a list of quizzes (used in cascading deletes)
    @Query(value = "{ 'quizId': { $in: ?0 } }", delete = true)
    void deleteByQuizIdIn(List<String> quizIds);
}