package com.nexuslms.engine.service;

import com.nexuslms.engine.exception.InvalidRequestException;
import com.nexuslms.engine.models.Grade;
import com.nexuslms.engine.models.GradeType;
import com.nexuslms.engine.repository.GradeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class GradeService {

    private final GradeRepository gradeRepository;

    public GradeService(GradeRepository gradeRepository) {
        this.gradeRepository = gradeRepository;
    }

    public Grade createGrade(Grade grade) {
        boolean classLevel = grade.getType() == GradeType.TEST || grade.getType() == GradeType.EXAM;
        if (classLevel) {
            if (grade.getClassId() == null || grade.getClassId().isBlank()) {
                throw new InvalidRequestException("A class-level grade must belong to a class.");
            }
            if (grade.getCourseId() != null && !grade.getCourseId().isBlank()) {
                throw new InvalidRequestException("A class-level grade can't also belong to a course.");
            }
        } else {
            if (grade.getCourseId() == null || grade.getCourseId().isBlank()) {
                throw new InvalidRequestException("A grade must belong to a course.");
            }
        }
        return gradeRepository.save(grade);
    }

    /** Records a submission grade, replacing any earlier one for the same assignment + student. */
    public Grade upsertSubmissionGrade(String tenantId, String studentId, String courseId,
                                       String assignmentId, Integer score, Integer totalMarks, String feedback) {
        Grade grade = gradeRepository.findByAssignmentIdAndStudentId(assignmentId, studentId)
                .orElseGet(Grade::new);
        grade.setTenantId(tenantId);
        grade.setStudentId(studentId);
        grade.setCourseId(courseId);
        grade.setClassId(null);
        grade.setAssignmentId(assignmentId);
        grade.setQuizId(null);
        grade.setScore(score);
        grade.setTotalMarks(totalMarks);
        grade.setFeedback(feedback);
        grade.setType(GradeType.ASSIGNMENT);
        return createGrade(grade);
    }

    /** Records a quiz score (QUIZ, TEST or EXAM), replacing any earlier one. */
    public Grade upsertQuizGrade(String tenantId, String studentId, String courseId, String classId,
                                 String quizId, Integer score, Integer totalMarks, GradeType type) {
        Grade grade = gradeRepository.findByQuizIdAndStudentId(quizId, studentId)
                .orElseGet(Grade::new);
        grade.setTenantId(tenantId);
        grade.setStudentId(studentId);
        grade.setCourseId(courseId);
        grade.setClassId(classId);
        grade.setAssignmentId(null);
        grade.setQuizId(quizId);
        grade.setScore(score);
        grade.setTotalMarks(totalMarks);
        grade.setType(type);
        return createGrade(grade);
    }

    public List<Grade> getGradesByStudentAndCourse(String studentId, String courseId) {
        return gradeRepository.findAllByStudentIdAndCourseId(studentId, courseId);
    }

    public List<Grade> getGradesByStudent(String studentId) {
        return gradeRepository.findAllByStudentId(studentId);
    }

    public List<Grade> getGradesByCourse(String courseId) {
        return gradeRepository.findAllByCourseId(courseId);
    }

    public Optional<Grade> getGradeByAssignmentAndStudent(String assignmentId, String studentId) {
        return gradeRepository.findByAssignmentIdAndStudentId(assignmentId, studentId);
    }

    public Optional<Grade> getGradeByQuizAndStudent(String quizId, String studentId) {
        return gradeRepository.findByQuizIdAndStudentId(quizId, studentId);
    }

    public Optional<Grade> getGradeById(String id) {
        return gradeRepository.findById(id);
    }

    public void deleteGrade(String id) {
        gradeRepository.deleteById(id);
    }
}