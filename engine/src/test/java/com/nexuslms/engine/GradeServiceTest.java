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

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GradeServiceTest {

    @Mock
    private GradeRepository gradeRepository;

    @InjectMocks
    private GradeService gradeService;

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
    void createGradeFromSubmission_Success() {
        when(gradeRepository.save(any(Grade.class))).thenReturn(grade);

        Grade result = gradeService.createGradeFromSubmission(
                "tenant1", "student1", "course1",
                "assignment1", 85, 100, "Good work!");

        assertNotNull(result);
        verify(gradeRepository, times(1)).save(any(Grade.class));
    }

    @Test
    void createGradeFromQuiz_Success() {
        when(gradeRepository.save(any(Grade.class))).thenReturn(grade);

        Grade result = gradeService.createGradeFromQuiz(
                "tenant1", "student1", "course1",
                "quiz1", 18, 20);

        assertNotNull(result);
        verify(gradeRepository, times(1)).save(any(Grade.class));
    }

    @Test
    void getGradesByStudent_ReturnsList() {
        when(gradeRepository.findAllByStudentId("student1"))
                .thenReturn(List.of(grade));

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

        Optional<Grade> result = gradeService.getGradeById("999");

        assertFalse(result.isPresent());
    }

    @Test
    void getGradeByAssignmentAndStudent_Found() {
        when(gradeRepository.findByAssignmentIdAndStudentId("assignment1", "student1"))
                .thenReturn(Optional.of(grade));

        Optional<Grade> result = gradeService
                .getGradeByAssignmentAndStudent("assignment1", "student1");

        assertTrue(result.isPresent());
        assertEquals(85, result.get().getScore());
    }
}