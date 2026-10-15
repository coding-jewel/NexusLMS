package com.nexuslms.engine.service;

import com.nexuslms.engine.dto.QuizRequest;
import com.nexuslms.engine.dto.QuizUpdateRequest;
import com.nexuslms.engine.exception.InvalidRequestException;
import com.nexuslms.engine.exception.NotFoundException;
import com.nexuslms.engine.models.Course;
import com.nexuslms.engine.models.Quiz;
import com.nexuslms.engine.models.QuizCategory;
import com.nexuslms.engine.models.SchoolClass;
import com.nexuslms.engine.models.User;
import com.nexuslms.engine.repository.CourseRepository;
import com.nexuslms.engine.repository.QuizAttemptRepository;
import com.nexuslms.engine.repository.QuizRepository;
import com.nexuslms.engine.repository.SchoolClassRepository;
import com.nexuslms.engine.repository.UserRepository;
import com.nexuslms.engine.security.AuthUser;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final CourseRepository courseRepository;
    private final SchoolClassRepository classRepository;
    private final UserRepository userRepository;

    public QuizService(QuizRepository quizRepository, QuizAttemptRepository quizAttemptRepository,
                       CourseRepository courseRepository, SchoolClassRepository classRepository,
                       UserRepository userRepository) {
        this.quizRepository = quizRepository;
        this.quizAttemptRepository = quizAttemptRepository;
        this.courseRepository = courseRepository;
        this.classRepository = classRepository;
        this.userRepository = userRepository;
    }

    public Quiz create(AuthUser auth, QuizRequest request) {
        QuizCategory category;
        try {
            category = QuizCategory.valueOf(request.category().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidRequestException("Category must be QUIZ, TEST or EXAM.");
        }

        Quiz quiz = new Quiz();
        quiz.setTenantId(auth.tenantId());
        quiz.setTeacherId(auth.userId());
        quiz.setCategory(category);
        quiz.setTitle(request.title().trim());
        quiz.setDescription(request.description() == null ? null : request.description().trim());
        quiz.setTimeLimitMinutes(request.timeLimitMinutes());
        quiz.setPublished(false);
        quiz.setResultsReleased(category == QuizCategory.QUIZ);
        quiz.setGuardMode(normalizeMode(request.guardMode()));
        quiz.setGuardLimit(normalizeLimit(request.guardLimit()));

        if (category == QuizCategory.QUIZ) {
            if (request.courseId() == null || request.courseId().isBlank()) {
                throw new InvalidRequestException("A quiz must belong to a course.");
            }
            Course course = courseRepository.findById(request.courseId())
                    .filter(c -> auth.tenantId().equals(c.getTenantId()))
                    .filter(c -> auth.userId().equals(c.getTeacherId()))
                    .orElseThrow(() -> new NotFoundException("Course not found"));
            quiz.setCourseId(course.getId());
        } else {
            if (request.classId() == null || request.classId().isBlank()) {
                throw new InvalidRequestException("A test or exam must belong to a class.");
            }
            SchoolClass schoolClass = classRepository.findById(request.classId())
                    .filter(c -> auth.tenantId().equals(c.getTenantId()))
                    .orElseThrow(() -> new NotFoundException("Class not found"));
            boolean assigned = userRepository.findById(auth.userId())
                    .filter(u -> auth.tenantId().equals(u.getTenantId()))
                    .map(User::getClassIds)
                    .map(list -> list.contains(schoolClass.getId()))
                    .orElse(false);
            if (!assigned) {
                throw new InvalidRequestException("You aren't assigned to this class. Ask your admin to add you.");
            }
            quiz.setClassId(schoolClass.getId());
        }

        return quizRepository.save(quiz);
    }

    /**
     * Replaces the editable fields of an existing quiz.
     * Refused once students have attempted it — answers are stored by question index,
     * so swapping questions would silently invalidate every attempt.
     */
    public Quiz update(AuthUser auth, String id, QuizUpdateRequest request) {
        Quiz quiz = owned(auth, id);
        if (quizAttemptRepository.existsByQuizId(quiz.getId())) {
            throw new InvalidRequestException("This quiz already has attempts. You can't edit it now.");
        }
        quiz.setTitle(request.title().trim());
        quiz.setDescription(request.description() == null ? null : request.description().trim());
        quiz.setTimeLimitMinutes(request.timeLimitMinutes());
        quiz.setQuestions(request.questions() == null ? new ArrayList<>() : new ArrayList<>(request.questions()));
        if (request.guardMode() != null) quiz.setGuardMode(normalizeMode(request.guardMode()));
        if (request.guardLimit() != null) quiz.setGuardLimit(normalizeLimit(request.guardLimit()));
        return quizRepository.save(quiz);
    }

    // --- reads ---

    public List<Quiz> getQuizzesByCourse(String courseId) {
        return quizRepository.findAllQuizzesByCourseId(courseId);
    }

    public List<Quiz> getPublishedQuizzesByCourse(String courseId) {
        return quizRepository.findPublishedQuizzesByCourseId(courseId);
    }

    public List<Quiz> getTestsAndExamsByTeacher(String teacherId) {
        return quizRepository.findAllTestsAndExamsByTeacherId(teacherId);
    }

    public List<Quiz> getTestsByClass(String classId) {
        return quizRepository.findAllByClassIdAndCategory(classId, "TEST");
    }

    public List<Quiz> getExamsByClass(String classId) {
        return quizRepository.findAllByClassIdAndCategory(classId, "EXAM");
    }

    public List<Quiz> getPublishedTestsByClass(String classId) {
        return quizRepository.findPublishedByClassIdAndCategory(classId, "TEST");
    }

    public List<Quiz> getPublishedExamsByClass(String classId) {
        return quizRepository.findPublishedByClassIdAndCategory(classId, "EXAM");
    }

    public Optional<Quiz> getQuizById(String id) {
        return quizRepository.findById(id);
    }

    // --- writes ---

    public Quiz publishQuiz(AuthUser auth, String id) {
        Quiz quiz = owned(auth, id);
        quiz.setPublished(true);
        return quizRepository.save(quiz);
    }

    public Quiz setReleased(AuthUser auth, String id, boolean released) {
        Quiz quiz = owned(auth, id);
        quiz.setResultsReleased(released);
        return quizRepository.save(quiz);
    }

    public Quiz addAttachment(AuthUser auth, String id, String fileUrl) {
        Quiz quiz = owned(auth, id);
        quiz.getAttachmentUrls().add(fileUrl);
        return quizRepository.save(quiz);
    }

    public void deleteQuiz(AuthUser auth, String id) {
        Quiz quiz = owned(auth, id);
        if (quizAttemptRepository.existsByQuizId(quiz.getId())) {
            throw new InvalidRequestException("This quiz already has attempts. You can't delete it now.");
        }
        quizRepository.deleteById(quiz.getId());
    }

    private Quiz owned(AuthUser auth, String id) {
        return quizRepository.findById(id)
                .filter(q -> auth.tenantId().equals(q.getTenantId()))
                .filter(q -> auth.userId().equals(q.getTeacherId()))
                .orElseThrow(() -> new NotFoundException("Quiz not found"));
    }

    private static String normalizeMode(String raw) {
        if (raw == null) return "RECORD";
        String v = raw.trim().toUpperCase();
        return switch (v) {
            case "OFF", "RECORD", "AUTO" -> v;
            default -> "RECORD";
        };
    }

    private static int normalizeLimit(Integer raw) {
        if (raw == null) return 3;
        return Math.max(1, Math.min(raw, 10));
    }
}