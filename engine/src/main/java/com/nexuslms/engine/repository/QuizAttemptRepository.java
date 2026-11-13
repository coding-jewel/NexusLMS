package com.nexuslms.engine.repository;

import com.nexuslms.engine.models.QuizAttempt;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
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

    @Query("{ 'quizId': ?0, 'graded': false, 'submitted': true }")
    List<QuizAttempt> findAllUngradedByQuizId(String quizId);

    @Query(value = "{ 'quizId': ?0, 'graded': false, 'submitted': true }", count = true)
    long countByQuizIdAndGradedFalse(String quizId);

    // FIXED: Changed LocalDateTime to Instant
    @Query("{ 'submitted': false, 'expiresAt': { $lt: ?0 } }")
    List<QuizAttempt> findExpiredUnsubmitted(Instant now);

    @Query(value = "{ 'quizId': { $in: ?0 } }", delete = true)
    void deleteByQuizIdIn(List<String> quizIds);

    @Query(value = "{ 'studentId': ?0, 'quizId': { $in: ?1 } }", delete = true)
    void deleteByStudentIdAndQuizIdIn(String studentId, List<String> quizIds);
}