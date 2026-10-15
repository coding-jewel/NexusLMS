package com.nexuslms.engine.service;

import com.nexuslms.engine.dto.GradeAttemptRequest;
import com.nexuslms.engine.dto.QuizAttemptRequest;
import com.nexuslms.engine.exception.DuplicateResourceException;
import com.nexuslms.engine.exception.NotFoundException;
import com.nexuslms.engine.models.Course;
import com.nexuslms.engine.models.GradeType;
import com.nexuslms.engine.models.Question;
import com.nexuslms.engine.models.QuestionType;
import com.nexuslms.engine.models.Quiz;
import com.nexuslms.engine.models.QuizAttempt;
import com.nexuslms.engine.models.QuizCategory;
import com.nexuslms.engine.models.User;
import com.nexuslms.engine.repository.CourseRepository;
import com.nexuslms.engine.repository.QuizAttemptRepository;
import com.nexuslms.engine.repository.QuizRepository;
import com.nexuslms.engine.repository.UserRepository;
import com.nexuslms.engine.security.AuthUser;
import org.springframework.stereotype.Service;

import java.util.List;
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

    /**
     * A student takes a quiz. The student is the caller; the quiz must be published and
     * must belong to a topic (or class) the student is enrolled in. One attempt only.
     */
    public QuizAttempt submitAttempt(AuthUser auth, QuizAttemptRequest request) {
        Quiz quiz = quizRepository.findById(request.quizId())
                .filter(Quiz::isPublished)
                .orElseThrow(() -> new NotFoundException("Quiz not found"));

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
        if (!enrolled) {
            throw new NotFoundException("Quiz not found");
        }

        QuizAttempt attempt = new QuizAttempt();
        attempt.setTenantId(auth.tenantId());
        attempt.setQuizId(quiz.getId());
        attempt.setStudentId(auth.userId());
        attempt.setAnswers(request.answers());
        attempt.setLeftPage(request.leftPage() == null ? 0 : Math.max(0, request.leftPage()));
        return submitAttempt(attempt);
    }

    /** Scoring loop. Callers should go through the AuthUser overload. */
    public QuizAttempt submitAttempt(QuizAttempt attempt) {
        if (quizAttemptRepository.existsByQuizIdAndStudentId(
                attempt.getQuizId(), attempt.getStudentId())) {
            throw new DuplicateResourceException("You have already attempted this quiz");
        }

        Quiz quiz = quizRepository.findById(attempt.getQuizId())
                .orElseThrow(() -> new NotFoundException("Quiz not found"));

        int totalScore = 0;
        int totalMarks = 0;
        boolean hasOpenEnded = false;

        List<Question> questions = quiz.getQuestions();
        for (int i = 0; i < questions.size(); i++) {
            Question question = questions.get(i);
            int marks = question.getMarks() != null ? question.getMarks() : 1;
            totalMarks += marks;
            String studentAnswer = attempt.getAnswers().get(String.valueOf(i));

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
        QuizAttempt saved = quizAttemptRepository.save(attempt);

        if (saved.isGraded()) {
            gradeService.upsertQuizGrade(
                    saved.getTenantId(), saved.getStudentId(),
                    quiz.getCourseId(), quiz.getClassId(),
                    quiz.getId(), totalScore, totalMarks, gradeTypeOf(quiz));
        }
        return saved;
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

        int current = attempt.getScore() == null ? 0 : attempt.getScore();
        attempt.setScore(current + request.additionalScore());
        attempt.setGraded(true);
        QuizAttempt saved = quizAttemptRepository.save(attempt);

        int totalMarks = quiz.getQuestions().stream()
                .mapToInt(q -> q.getMarks() != null ? q.getMarks() : 1)
                .sum();
        gradeService.upsertQuizGrade(
                saved.getTenantId(), saved.getStudentId(),
                quiz.getCourseId(), quiz.getClassId(),
                quiz.getId(), saved.getScore(), totalMarks, gradeTypeOf(quiz));

        return saved;
    }

    public void deleteAttempt(String id) {
        quizAttemptRepository.deleteById(id);
    }

    private GradeType gradeTypeOf(Quiz quiz) {
        return switch (quiz.getCategory()) {
            case QUIZ -> GradeType.QUIZ;
            case TEST -> GradeType.TEST;
            case EXAM -> GradeType.EXAM;
        };
    }
}