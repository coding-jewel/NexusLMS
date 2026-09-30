package com.nexuslms.engine.service;

import com.nexuslms.engine.exception.DuplicateResourceException;
import com.nexuslms.engine.models.Question;
import com.nexuslms.engine.models.QuestionType;
import com.nexuslms.engine.models.Quiz;
import com.nexuslms.engine.models.QuizAttempt;
import com.nexuslms.engine.repository.QuizAttemptRepository;
import com.nexuslms.engine.repository.QuizRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class QuizAttemptService {

    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizRepository quizRepository;

    public QuizAttemptService(QuizAttemptRepository quizAttemptRepository,
                              QuizRepository quizRepository) {
        this.quizAttemptRepository = quizAttemptRepository;
        this.quizRepository = quizRepository;
    }

    public QuizAttempt submitAttempt(QuizAttempt attempt) {
        if (quizAttemptRepository.existsByQuizIdAndStudentId(
                attempt.getQuizId(), attempt.getStudentId())) {
            throw new DuplicateResourceException("You have already attempted this quiz");
        }

        Quiz quiz = quizRepository.findById(attempt.getQuizId())
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        int totalScore = 0;
        boolean hasOpenEnded = false;

        List<Question> questions = quiz.getQuestions();
        for (int i = 0; i < questions.size(); i++) {
            Question question = questions.get(i);
            String studentAnswer = attempt.getAnswers().get(String.valueOf(i));

            if (question.getType() == QuestionType.MULTIPLE_CHOICE) {
                if (studentAnswer != null &&
                        studentAnswer.equals(question.getCorrectAnswer())) {
                    totalScore += question.getMarks() != null ? question.getMarks() : 1;
                }
            } else {
                hasOpenEnded = true;
            }
        }

        attempt.setScore(totalScore);
        attempt.setGraded(!hasOpenEnded);
        return quizAttemptRepository.save(attempt);
    }

    public List<QuizAttempt> getAllAttemptsByQuiz(String quizId) {
        return quizAttemptRepository.findAllByQuizId(quizId);
    }

    public List<QuizAttempt> getAllAttemptsByStudent(String studentId) {
        return quizAttemptRepository.findAllByStudentId(studentId);
    }

    public Optional<QuizAttempt> getAttemptByQuizAndStudent(String quizId, String studentId) {
        return quizAttemptRepository.findByQuizIdAndStudentId(quizId, studentId);
    }

    public Optional<QuizAttempt> getAttemptById(String id) {
        return quizAttemptRepository.findById(id);
    }

    public List<QuizAttempt> getUngradedAttempts(String quizId) {
        return quizAttemptRepository.findAllUngradedByQuizId(quizId);
    }

    public QuizAttempt gradeAttempt(String id, Integer additionalScore) {
        QuizAttempt attempt = quizAttemptRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));
        attempt.setScore(attempt.getScore() + additionalScore);
        attempt.setGraded(true);
        return quizAttemptRepository.save(attempt);
    }

    public void deleteAttempt(String id) {
        quizAttemptRepository.deleteById(id);
    }
}