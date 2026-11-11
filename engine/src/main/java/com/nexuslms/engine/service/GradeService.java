package com.nexuslms.engine.service;

import com.nexuslms.engine.exception.InvalidRequestException;
import com.nexuslms.engine.models.Grade;
import com.nexuslms.engine.models.GradeType;
import com.nexuslms.engine.repository.GradeRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.IncorrectResultSizeDataAccessException;
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
        // FIXED: Removed GradeType.TEST since only EXAM remains at the class level
        boolean classLevel = grade.getType() == GradeType.EXAM;
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

    /** Records a submission grade. Updates if it exists (for teacher grading), creates if it doesn't. */
    public Grade upsertSubmissionGrade(String tenantId, String studentId, String courseId,
                                       String assignmentId, Integer score, Integer totalMarks, String feedback) {
        Grade grade = null;

        try {
            grade = gradeRepository.findByAssignmentIdAndStudentId(assignmentId, studentId).orElse(null);
        } catch (IncorrectResultSizeDataAccessException e) {
            // SELF-HEALING: If old duplicates exist from a previous glitch, clean them up.
            List<Grade> matches = gradeRepository.findAllByStudentId(studentId).stream()
                    .filter(g -> assignmentId.equals(g.getAssignmentId()))
                    .toList();
            if (!matches.isEmpty()) {
                grade = matches.get(0);
                for (int i = 1; i < matches.size(); i++) {
                    gradeRepository.delete(matches.get(i));
                }
            }
        }

        if (grade == null) {
            grade = new Grade();
        }

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

        try {
            return createGrade(grade);
        } catch (DuplicateKeyException e) {
            // RACE CONDITION: Two requests hit at the same time. Update the existing one.
            Grade existing = gradeRepository.findByAssignmentIdAndStudentId(assignmentId, studentId).orElseThrow();
            existing.setScore(score);
            existing.setTotalMarks(totalMarks);
            existing.setFeedback(feedback);
            return gradeRepository.save(existing);
        }
    }

    /** Records a quiz score (QUIZ or EXAM). Updates if it exists (for teacher grading), creates if it doesn't. */
    public Grade upsertQuizGrade(String tenantId, String studentId, String courseId, String classId,
                                 String quizId, Integer score, Integer totalMarks, GradeType type) {
        Grade grade = null;

        try {
            grade = gradeRepository.findByQuizIdAndStudentId(quizId, studentId).orElse(null);
        } catch (IncorrectResultSizeDataAccessException e) {
            // SELF-HEALING: If old duplicates exist, clean them up.
            List<Grade> matches = gradeRepository.findAllByStudentId(studentId).stream()
                    .filter(g -> quizId.equals(g.getQuizId()))
                    .toList();
            if (!matches.isEmpty()) {
                grade = matches.get(0);
                for (int i = 1; i < matches.size(); i++) {
                    gradeRepository.delete(matches.get(i));
                }
            }
        }

        if (grade == null) {
            grade = new Grade();
        }

        grade.setTenantId(tenantId);
        grade.setStudentId(studentId);
        grade.setCourseId(courseId);
        grade.setClassId(classId);
        grade.setAssignmentId(null);
        grade.setQuizId(quizId);
        grade.setScore(score);
        grade.setTotalMarks(totalMarks);
        grade.setType(type);

        try {
            return createGrade(grade);
        } catch (DuplicateKeyException e) {
            // RACE CONDITION: Two requests hit at the same time. Update the existing one.
            Grade existing = gradeRepository.findByQuizIdAndStudentId(quizId, studentId).orElseThrow();
            existing.setScore(score);
            existing.setTotalMarks(totalMarks);
            return gradeRepository.save(existing);
        }
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