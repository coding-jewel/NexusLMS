package com.nexuslms.engine.service;

import com.nexuslms.engine.dto.GradeAttemptRequest;
import com.nexuslms.engine.exception.DuplicateResourceException;
import com.nexuslms.engine.exception.InvalidRequestException;
import com.nexuslms.engine.exception.NotFoundException;
import com.nexuslms.engine.models.*;
import com.nexuslms.engine.repository.*;
import com.nexuslms.engine.security.AuthUser;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class QuizAttemptService {

    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizRepository quizRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final GradeService gradeService;

    public QuizAttemptService(QuizAttemptRepository quizAttemptRepository,
                              QuizRepository quizRepository,
                              CourseRepository courseRepository,
                              UserRepository userRepository,
                              GradeService gradeService) {
        this.quizAttemptRepository = quizAttemptRepository;
        this.quizRepository = quizRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.gradeService = gradeService;
    }

    public QuizAttempt startAttempt(AuthUser auth, String quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .filter(Quiz::isPublished)
                .orElseThrow(() -> new NotFoundException("Quiz not found"));
        verifyEnrolled(auth, quiz);

        Optional<QuizAttempt> existing = quizAttemptRepository.findByQuizIdAndStudentId(quizId, auth.userId());
        if (existing.isPresent()) {
            QuizAttempt attempt = existing.get();
            if (attempt.isSubmitted() || attempt.isGraded()) {
                throw new DuplicateResourceException("You have already attempted this quiz");
            }
            // If they come back after time ran out, auto submit them
            if (attempt.getExpiresAt() != null && attempt.getExpiresAt().isBefore(Instant.now())) {
                finalizeAttempt(attempt, quiz);
                throw new DuplicateResourceException("The time for this quiz has run out. Your attempt was submitted automatically.");
            }
            // If they have time left, return the existing attempt (timer keeps counting down)
            return attempt;
        }

        // TIMER STARTS HERE: Only when they click "Start" for the first time
        int limit = quiz.getTimeLimitMinutes() != null ? quiz.getTimeLimitMinutes() : 30;
        Instant now = Instant.now();

        QuizAttempt attempt = new QuizAttempt();
        attempt.setTenantId(auth.tenantId());
        attempt.setQuizId(quiz.getId());
        attempt.setStudentId(auth.userId());
        attempt.setAnswers(new java.util.HashMap<>());
        attempt.setStartedAt(now);
        attempt.setExpiresAt(now.plus(limit, ChronoUnit.MINUTES));
        attempt.setSubmitted(false);
        return quizAttemptRepository.save(attempt);
    }

    public QuizAttempt submitAttempt(AuthUser auth, String attemptId, Map<String, String> answers) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .filter(a -> auth.tenantId().equals(a.getTenantId()))
                .filter(a -> auth.userId().equals(a.getStudentId()))
                .orElseThrow(() -> new NotFoundException("Attempt not found"));

        if (attempt.isSubmitted()) {
            throw new DuplicateResourceException("This attempt has already been submitted");
        }

        Quiz quiz = quizRepository.findById(attempt.getQuizId())
                .orElseThrow(() -> new NotFoundException("Quiz not found"));

        attempt.setAnswers(answers);
        return finalizeAttempt(attempt, quiz);
    }

    // Closing the tab fully grades the exam
    public void abandonAttempt(AuthUser auth, String attemptId) {
        quizAttemptRepository.findById(attemptId)
                .filter(a -> auth.tenantId().equals(a.getTenantId()))
                .filter(a -> auth.userId().equals(a.getStudentId()))
                .ifPresent(attempt -> {
                    if (!attempt.isSubmitted()) {
                        Quiz quiz = quizRepository.findById(attempt.getQuizId()).orElse(null);
                        if (quiz != null) {
                            // This will calculate the MCQ score, mark it graded, and sync to the Gradebook
                            finalizeAttempt(attempt, quiz); 
                        } else {
                            // Fallback: If the quiz was deleted, just close the attempt
                            attempt.setSubmitted(true);
                            attempt.setSubmittedAt(Instant.now());
                            quizAttemptRepository.save(attempt);
                        }
                    }
                });
    }

    @Scheduled(fixedRate = 30000)
    public void autoSubmitExpiredAttempts() {
        List<QuizAttempt> expired = quizAttemptRepository.findExpiredUnsubmitted(Instant.now());
        for (QuizAttempt attempt : expired) {
            try {
                Quiz quiz = quizRepository.findById(attempt.getQuizId()).orElse(null);
                if (quiz != null) {
                    finalizeAttempt(attempt, quiz);
                }
            } catch (Exception ignored) {
            }
        }
    }

    private QuizAttempt finalizeAttempt(QuizAttempt attempt, Quiz quiz) {
        int totalScore = 0;
        boolean hasOpenEnded = false;
        List<Question> questions = quiz.getQuestions();
        for (int i = 0; i < questions.size(); i++) {
            Question question = questions.get(i);
            int marks = question.getMarks() != null ? question.getMarks() : 1;
            String studentAnswer = attempt.getAnswers() != null ? attempt.getAnswers().get(String.valueOf(i)) : null;

            if (question.getType() == QuestionType.MULTIPLE_CHOICE) {
                if (studentAnswer != null && studentAnswer.equals(question.getCorrectAnswer())) {
                    totalScore += marks;
                }
            } else {
                hasOpenEnded = true;
            }
        }

        attempt.setScore(totalScore);
        attempt.setGraded(!hasOpenEnded);
        attempt.setSubmitted(true);
        attempt.setSubmittedAt(Instant.now());
        QuizAttempt saved = quizAttemptRepository.save(attempt);

        if (saved.isGraded()) {
            gradeService.upsertQuizGrade(
                    saved.getTenantId(), saved.getStudentId(),
                    quiz.getCourseId(), quiz.getClassId(),
                    quiz.getId(), totalScore, quiz.effectiveTotalMarks(), gradeTypeOf(quiz));
        }
        return saved;
    }

    private void verifyEnrolled(AuthUser auth, Quiz quiz) {
        User me = userRepository.findById(auth.userId())
                .filter(u -> auth.tenantId().equals(u.getTenantId()))
                .orElseThrow(() -> new NotFoundException("Quiz not found"));
        boolean enrolled;
        if (quiz.getCategory() == QuizCategory.QUIZ) {
            Course course = courseRepository.findById(quiz.getCourseId())
                    .orElseThrow(() -> new NotFoundException("Quiz not found"));
            enrolled = me.getClassIds().contains(course.getClassId());
        } else {
            enrolled = me.getClassIds().contains(quiz.getClassId());
        }
        if (!enrolled) throw new NotFoundException("Quiz not found");
    }

    public Optional<QuizAttempt> myAttemptFor(AuthUser auth, String quizId) {
        return quizAttemptRepository.findByQuizIdAndStudentId(quizId, auth.userId())
                .filter(a -> auth.tenantId().equals(a.getTenantId()));
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

    public QuizAttempt gradeAttempt(AuthUser auth, String attemptId, GradeAttemptRequest request) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .filter(a -> auth.tenantId().equals(a.getTenantId()))
                .orElseThrow(() -> new NotFoundException("Attempt not found"));
        Quiz quiz = quizRepository.findById(attempt.getQuizId())
                .filter(q -> auth.userId().equals(q.getTeacherId()))
                .orElseThrow(() -> new NotFoundException("Attempt not found"));

        boolean isClassLevel = quiz.getCategory() == QuizCategory.EXAM;
        if (isClassLevel && quiz.isResultsReleased()) {
            throw new InvalidRequestException("Results have already been released. You cannot update marks.");
        }

        int current = attempt.getScore() == null ? 0 : attempt.getScore();
        int newScore = current + request.additionalScore();

        if (newScore < 0) throw new InvalidRequestException("The final score cannot be negative.");
        if (newScore > quiz.effectiveTotalMarks()) {
            throw new InvalidRequestException("Score can't be higher than the quiz total of " + quiz.effectiveTotalMarks() + ".");
        }

        attempt.setScore(newScore);
        attempt.setGraded(true);

        if (!attempt.isSubmitted()) {
            attempt.setSubmitted(true);
            attempt.setSubmittedAt(Instant.now());
        }

        QuizAttempt saved = quizAttemptRepository.save(attempt);

        gradeService.upsertQuizGrade(
                saved.getTenantId(), saved.getStudentId(),
                quiz.getCourseId(), quiz.getClassId(),
                quiz.getId(), saved.getScore(), quiz.effectiveTotalMarks(), gradeTypeOf(quiz));

        return saved;
    }

    public void deleteAttempt(String id) {
        quizAttemptRepository.deleteById(id);
    }

    private GradeType gradeTypeOf(Quiz quiz) {
        return switch (quiz.getCategory()) {
            case QUIZ -> GradeType.QUIZ;
            case EXAM -> GradeType.EXAM;
        };
    }
}