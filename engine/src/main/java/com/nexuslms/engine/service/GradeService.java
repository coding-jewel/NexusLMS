package com.nexuslms.engine.service;

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
        return gradeRepository.save(grade);
    }

    public Grade createGradeFromSubmission(String tenantId, String studentId,
                                           String courseId, String assignmentId, Integer score,
                                           Integer totalMarks, String feedback) {
        Grade grade = new Grade();
        grade.setTenantId(tenantId);
        grade.setStudentId(studentId);
        grade.setCourseId(courseId);
        grade.setAssignmentId(assignmentId);
        grade.setScore(score);
        grade.setTotalMarks(totalMarks);
        grade.setFeedback(feedback);
        grade.setType(GradeType.ASSIGNMENT);
        return gradeRepository.save(grade);
    }

    public Grade createGradeFromQuiz(String tenantId, String studentId,
                                     String courseId, String quizId, Integer score, Integer totalMarks) {
        Grade grade = new Grade();
        grade.setTenantId(tenantId);
        grade.setStudentId(studentId);
        grade.setCourseId(courseId);
        grade.setQuizId(quizId);
        grade.setScore(score);
        grade.setTotalMarks(totalMarks);
        grade.setType(GradeType.QUIZ);
        return gradeRepository.save(grade);
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