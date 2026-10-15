package com.nexuslms.engine;

import com.nexuslms.engine.models.Grade;
import com.nexuslms.engine.models.GradeType;
import com.nexuslms.engine.repository.GradeRepository;
import com.nexuslms.engine.service.GradeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class GradeServiceTest {

    @Mock private GradeRepository gradeRepository;
    @InjectMocks private GradeService gradeService;

    private Grade grade;

    @BeforeEach
    void setUp() {
        grade = new Grade();
        grade.setId("1");
        grade.setTenantId("tenant1");
        grade.setStudentId("student1");
        grade.setCourseId("course1");
        grade.setAssignmentId("assignment1");
        grade.setScore(85);
        grade.setTotalMarks(100);
        grade.setFeedback("Good work!");
        grade.setType(GradeType.ASSIGNMENT);
    }

    @Test
    void createGrade_Success() {
        when(gradeRepository.save(grade)).thenReturn(grade);

        Grade result = gradeService.createGrade(grade);

        assertNotNull(result);
        assertEquals(85, result.getScore());
        assertEquals(100, result.getTotalMarks());
        verify(gradeRepository, times(1)).save(grade);
    }

    @Test
    void upsertSubmissionGrade_WritesAnAssignmentGrade() {
        when(gradeRepository.findByAssignmentIdAndStudentId("assignment1", "student1"))
                .thenReturn(Optional.empty());
        when(gradeRepository.save(any(Grade.class))).thenAnswer(i -> i.getArgument(0));

        Grade result = gradeService.upsertSubmissionGrade(
                "tenant1", "student1", "course1", "assignment1", 85, 100, "Good work!");

        assertEquals(GradeType.ASSIGNMENT, result.getType());
        assertEquals("course1", result.getCourseId());
        assertNull(result.getClassId());
        verify(gradeRepository, times(1)).save(any(Grade.class));
    }

    @Test
    void upsertQuizGrade_QuizUsesCourseId() {
        when(gradeRepository.findByQuizIdAndStudentId("quiz1", "student1"))
                .thenReturn(Optional.empty());
        when(gradeRepository.save(any(Grade.class))).thenAnswer(i -> i.getArgument(0));

        Grade result = gradeService.upsertQuizGrade(
                "tenant1", "student1", "course1", null,
                "quiz1", 18, 20, GradeType.QUIZ);

        assertEquals(GradeType.QUIZ, result.getType());
        assertEquals("course1", result.getCourseId());
        assertNull(result.getClassId());
    }

    @Test
    void upsertQuizGrade_TestUsesClassId() {
        when(gradeRepository.findByQuizIdAndStudentId("test1", "student1"))
                .thenReturn(Optional.empty());
        when(gradeRepository.save(any(Grade.class))).thenAnswer(i -> i.getArgument(0));

        Grade result = gradeService.upsertQuizGrade(
                "tenant1", "student1", null, "class1",
                "test1", 45, 60, GradeType.TEST);

        assertEquals(GradeType.TEST, result.getType());
        assertNull(result.getCourseId());
        assertEquals("class1", result.getClassId());
    }

    @Test
    void upsertQuizGrade_ExamUsesClassId() {
        when(gradeRepository.findByQuizIdAndStudentId("exam1", "student1"))
                .thenReturn(Optional.empty());
        when(gradeRepository.save(any(Grade.class))).thenAnswer(i -> i.getArgument(0));

        Grade result = gradeService.upsertQuizGrade(
                "tenant1", "student1", null, "class1",
                "exam1", 45, 60, GradeType.EXAM);

        assertEquals(GradeType.EXAM, result.getType());
        assertNull(result.getCourseId());
        assertEquals("class1", result.getClassId());
    }

    @Test
    void getGradesByStudent_ReturnsList() {
        when(gradeRepository.findAllByStudentId("student1")).thenReturn(List.of(grade));

        List<Grade> results = gradeService.getGradesByStudent("student1");

        assertEquals(1, results.size());
        assertEquals(85, results.get(0).getScore());
    }

    @Test
    void getGradeById_Found() {
        when(gradeRepository.findById("1")).thenReturn(Optional.of(grade));

        Optional<Grade> result = gradeService.getGradeById("1");

        assertTrue(result.isPresent());
        assertEquals(GradeType.ASSIGNMENT, result.get().getType());
    }

    @Test
    void getGradeById_NotFound() {
        when(gradeRepository.findById("999")).thenReturn(Optional.empty());

        assertFalse(gradeService.getGradeById("999").isPresent());
    }

    @Test
    void getGradeByAssignmentAndStudent_Found() {
        when(gradeRepository.findByAssignmentIdAndStudentId("assignment1", "student1"))
                .thenReturn(Optional.of(grade));

        Optional<Grade> result = gradeService.getGradeByAssignmentAndStudent("assignment1", "student1");

        assertTrue(result.isPresent());
        assertEquals(85, result.get().getScore());
    }
}