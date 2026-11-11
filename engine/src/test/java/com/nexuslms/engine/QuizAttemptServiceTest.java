package com.nexuslms.engine;

import com.nexuslms.engine.exception.DuplicateResourceException;
import com.nexuslms.engine.models.*;
import com.nexuslms.engine.repository.CourseRepository;
import com.nexuslms.engine.repository.QuizAttemptRepository;
import com.nexuslms.engine.repository.QuizRepository;
import com.nexuslms.engine.repository.UserRepository;
import com.nexuslms.engine.security.AuthUser;
import com.nexuslms.engine.service.GradeService;
import com.nexuslms.engine.service.QuizAttemptService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class QuizAttemptServiceTest {

    @Mock private QuizAttemptRepository quizAttemptRepository;
    @Mock private QuizRepository quizRepository;
    @Mock private CourseRepository courseRepository;
    @Mock private UserRepository userRepository;
    @Mock private GradeService gradeService;
    @InjectMocks private QuizAttemptService quizAttemptService;

    private AuthUser studentAuth;
    private Quiz quiz;
    private QuizAttempt attempt;

    @BeforeEach
    void setUp() {
        studentAuth = new AuthUser("student1", "student@lincoln.edu", "tenant1", "STUDENT");

        Question mcqQuestion = new Question();
        mcqQuestion.setText("What is 2 + 2?");
        mcqQuestion.setType(QuestionType.MULTIPLE_CHOICE);
        mcqQuestion.setCorrectAnswer("4");
        mcqQuestion.setMarks(2);

        Question openQuestion = new Question();
        openQuestion.setText("Explain OOP");
        openQuestion.setType(QuestionType.OPEN_ENDED);
        openQuestion.setMarks(5);

        quiz = new Quiz();
        quiz.setId("quiz1");
        quiz.setTenantId("tenant1");
        quiz.setCategory(QuizCategory.QUIZ);
        quiz.setCourseId("course1");
        quiz.setTeacherId("teacher1");
        quiz.setTitle("Test Quiz");
        List<Question> questions = new ArrayList<>();
        questions.add(mcqQuestion);
        questions.add(openQuestion);
        quiz.setQuestions(questions);

        attempt = new QuizAttempt();
        attempt.setId("attempt1");
        attempt.setTenantId("tenant1");
        attempt.setQuizId("quiz1");
        attempt.setStudentId("student1");
    }

    @Test
    void submitAttempt_MCQCorrect_ScoreAdded() {
        Map<String, String> answers = new HashMap<>();
        answers.put("0", "4");
        answers.put("1", "OOP is a programming paradigm");

        when(quizAttemptRepository.findById("attempt1")).thenReturn(Optional.of(attempt));
        when(quizRepository.findById("quiz1")).thenReturn(Optional.of(quiz));
        when(quizAttemptRepository.save(any(QuizAttempt.class))).thenAnswer(i -> i.getArgument(0));

        QuizAttempt result = quizAttemptService.submitAttempt(studentAuth, "attempt1", answers);

        assertEquals(2, result.getScore());
        assertTrue(result.isSubmitted());
        assertNotNull(result.getSubmittedAt());
    }

    @Test
    void submitAttempt_HasOpenEnded_NotFullyGraded() {
        Map<String, String> answers = new HashMap<>();
        answers.put("0", "4");
        answers.put("1", "OOP is a programming paradigm");

        when(quizAttemptRepository.findById("attempt1")).thenReturn(Optional.of(attempt));
        when(quizRepository.findById("quiz1")).thenReturn(Optional.of(quiz));
        when(quizAttemptRepository.save(any(QuizAttempt.class))).thenAnswer(i -> i.getArgument(0));

        QuizAttempt result = quizAttemptService.submitAttempt(studentAuth, "attempt1", answers);

        assertFalse(result.isGraded());
        verify(gradeService, never()).upsertQuizGrade(
                anyString(), anyString(), any(), any(), anyString(),
                anyInt(), anyInt(), any());
    }

    @Test
    void submitAttempt_AllMCQ_FullyGraded() {
        Question mcqQuestion2 = new Question();
        mcqQuestion2.setText("What is Java?");
        mcqQuestion2.setType(QuestionType.MULTIPLE_CHOICE);
        mcqQuestion2.setCorrectAnswer("A language");
        mcqQuestion2.setMarks(3);

        quiz.setQuestions(List.of(quiz.getQuestions().get(0), mcqQuestion2));

        Map<String, String> answers = new HashMap<>();
        answers.put("0", "4");
        answers.put("1", "A language");

        when(quizAttemptRepository.findById("attempt1")).thenReturn(Optional.of(attempt));
        when(quizRepository.findById("quiz1")).thenReturn(Optional.of(quiz));
        when(quizAttemptRepository.save(any(QuizAttempt.class))).thenAnswer(i -> i.getArgument(0));

        QuizAttempt result = quizAttemptService.submitAttempt(studentAuth, "attempt1", answers);

        assertTrue(result.isGraded());
        assertEquals(5, result.getScore());
        verify(gradeService).upsertQuizGrade(
                eq("tenant1"), eq("student1"), eq("course1"), isNull(),
                eq("quiz1"), eq(5), eq(5), eq(GradeType.QUIZ));
    }

    @Test
    void submitAttempt_WrongAnswer_NoScore() {
        Map<String, String> answers = new HashMap<>();
        answers.put("0", "5"); // Wrong answer

        when(quizAttemptRepository.findById("attempt1")).thenReturn(Optional.of(attempt));
        when(quizRepository.findById("quiz1")).thenReturn(Optional.of(quiz));
        when(quizAttemptRepository.save(any(QuizAttempt.class))).thenAnswer(i -> i.getArgument(0));

        QuizAttempt result = quizAttemptService.submitAttempt(studentAuth, "attempt1", answers);

        assertEquals(0, result.getScore());
    }

    @Test
    void submitAttempt_AlreadyAttempted_ThrowsException() {
        attempt.setSubmitted(true);

        Map<String, String> answers = new HashMap<>();

        when(quizAttemptRepository.findById("attempt1")).thenReturn(Optional.of(attempt));

        assertThrows(DuplicateResourceException.class, () -> {
            quizAttemptService.submitAttempt(studentAuth, "attempt1", answers);
        });

        verify(quizAttemptRepository, never()).save(any());
    }
}