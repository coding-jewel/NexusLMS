package com.nexuslms.engine.service;

import com.nexuslms.engine.dto.TeacherStatsResponse;
import com.nexuslms.engine.exception.NotFoundException;
import com.nexuslms.engine.models.Assignment;
import com.nexuslms.engine.models.Course;
import com.nexuslms.engine.models.Quiz;
import com.nexuslms.engine.models.User;
import com.nexuslms.engine.repository.AssignmentRepository;
import com.nexuslms.engine.repository.CourseRepository;
import com.nexuslms.engine.repository.QuizAttemptRepository;
import com.nexuslms.engine.repository.QuizRepository;
import com.nexuslms.engine.repository.SubmissionRepository;
import com.nexuslms.engine.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class TeacherStatsService {

    private static final int TO_GRADE_LIMIT = 5;

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final AssignmentRepository assignmentRepository;
    private final QuizRepository quizRepository;
    private final SubmissionRepository submissionRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    public TeacherStatsService(UserRepository userRepository, CourseRepository courseRepository,
                               AssignmentRepository assignmentRepository, QuizRepository quizRepository,
                               SubmissionRepository submissionRepository,
                               QuizAttemptRepository quizAttemptRepository) {
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.assignmentRepository = assignmentRepository;
        this.quizRepository = quizRepository;
        this.submissionRepository = submissionRepository;
        this.quizAttemptRepository = quizAttemptRepository;
    }

    public TeacherStatsResponse forTeacher(String tenantId, String teacherId) {
        User me = userRepository.findById(teacherId)
                .filter(u -> tenantId.equals(u.getTenantId()))
                .orElseThrow(() -> new NotFoundException("Teacher not found"));

        List<Course> courses = courseRepository.findAllByTeacherId(teacherId);

        long totalAssignments = 0;
        List<TeacherStatsResponse.ToGrade> waiting = new ArrayList<>();

        for (Course c : courses) {
            List<Assignment> assignments = assignmentRepository.findAllByCourseId(c.getId());
            List<Quiz> quizzes = quizRepository.findAllQuizzesByCourseId(c.getId());
            totalAssignments += assignments.size();

            for (Assignment a : assignments) {
                long n = submissionRepository.countByAssignmentIdAndGradedFalse(a.getId());
                if (n > 0) {
                    waiting.add(new TeacherStatsResponse.ToGrade(
                            "assignment", c.getId(), c.getTitle(), a.getId(), a.getTitle(), n));
                }
            }
            for (Quiz q : quizzes) {
                long n = quizAttemptRepository.countByQuizIdAndGradedFalse(q.getId());
                if (n > 0) {
                    waiting.add(new TeacherStatsResponse.ToGrade(
                            "quiz", c.getId(), c.getTitle(), q.getId(), q.getTitle(), n));
                }
            }
        }

        for (String classId : me.getClassIds()) {
            List<Quiz> classExams = quizRepository.findAllByClassIdAndCategory(classId, "EXAM");

            for (Quiz q : classExams) {
                long n = quizAttemptRepository.countByQuizIdAndGradedFalse(q.getId());
                if (n > 0) {
                    // FIXED: Changed "quiz" to "exam" so the frontend routes correctly
                    waiting.add(new TeacherStatsResponse.ToGrade(
                            "exam", classId, "Class Exam", q.getId(), q.getTitle(), n));
                }
            }
        }

        List<TeacherStatsResponse.ToGrade> top = waiting.stream()
                .sorted(Comparator.comparingLong(TeacherStatsResponse.ToGrade::count).reversed())
                .limit(TO_GRADE_LIMIT)
                .toList();

        return new TeacherStatsResponse(
                me.getClassIds().size(),
                courses.size(),
                totalAssignments,
                top
        );
    }
}