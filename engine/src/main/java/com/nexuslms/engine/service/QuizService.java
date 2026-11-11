package com.nexuslms.engine.service;

import com.nexuslms.engine.dto.QuizRequest;
import com.nexuslms.engine.dto.QuizUpdateRequest;
import com.nexuslms.engine.dto.StudentQuizResponse;
import com.nexuslms.engine.exception.InvalidRequestException;
import com.nexuslms.engine.exception.NotFoundException;
import com.nexuslms.engine.models.Course;
import com.nexuslms.engine.models.Question;
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
        quiz.setTotalMarks(request.totalMarks());
        quiz.setPublished(false);
        quiz.setResultsReleased(category == QuizCategory.QUIZ);
        // REMOVED: setGuardMode and setGuardLimit

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

    public Quiz update(AuthUser auth, String id, QuizUpdateRequest request) {
        Quiz quiz = owned(auth, id);

        if (quiz.isPublished()) {
            throw new InvalidRequestException("This quiz is already published. You can't edit it now.");
        }
        if (quizAttemptRepository.existsByQuizId(quiz.getId())) {
            throw new InvalidRequestException("This quiz already has attempts. You can't edit it now.");
        }

        List<Question> questions = request.questions() == null ? new ArrayList<>() : new ArrayList<>(request.questions());
        int sum = questions.stream().mapToInt(q -> q.getMarks() != null ? q.getMarks() : 1).sum();
        if (sum > request.totalMarks()) {
            throw new InvalidRequestException(
                    "Questions add up to " + sum + ", which is more than the total of " + request.totalMarks() + ".");
        }

        quiz.setTitle(request.title().trim());
        quiz.setDescription(request.description() == null ? null : request.description().trim());
        quiz.setTimeLimitMinutes(request.timeLimitMinutes());
        quiz.setTotalMarks(request.totalMarks());
        quiz.setQuestions(questions);
        // REMOVED: setGuardMode and setGuardLimit
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

    public List<Quiz> getPublishedTestsAndExamsByClass(String classId) {
        return quizRepository.findPublishedTestsAndExamsByClassId(classId);
    }

    public Optional<Quiz> getQuizById(String id) {
        return quizRepository.findById(id);
    }

    public StudentQuizResponse getQuizForStudent(AuthUser auth, String id) {
        Quiz quiz = quizRepository.findById(id)
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
        return StudentQuizResponse.from(quiz);
    }

    // --- writes ---

    public Quiz publishQuiz(AuthUser auth, String id) {
        Quiz quiz = owned(auth, id);
        int sum = quiz.getQuestions().stream().mapToInt(q -> q.getMarks() != null ? q.getMarks() : 1).sum();
        if (sum != quiz.getTotalMarks()) {
            throw new InvalidRequestException(
                    "Questions add up to " + sum + ", but the total is " + quiz.getTotalMarks() + ". They must match exactly before publishing.");
        }
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

    // REMOVED: normalizeMode and normalizeLimit
}