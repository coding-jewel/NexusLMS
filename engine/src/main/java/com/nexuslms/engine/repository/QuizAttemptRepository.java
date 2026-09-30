package com.nexuslms.engine.repository;

import com.nexuslms.engine.models.QuizAttempt;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

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

    @Query("{ 'quizId': ?0, 'graded': false }")
    List<QuizAttempt> findAllUngradedByQuizId(String quizId);
}