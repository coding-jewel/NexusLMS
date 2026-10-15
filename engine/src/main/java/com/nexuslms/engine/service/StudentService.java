package com.nexuslms.engine.service;

import com.nexuslms.engine.dto.StudentGradesResponse;
import com.nexuslms.engine.dto.StudentTopicResponse;
import com.nexuslms.engine.exception.NotFoundException;
import com.nexuslms.engine.models.Assignment;
import com.nexuslms.engine.models.Course;
import com.nexuslms.engine.models.Quiz;
import com.nexuslms.engine.models.QuizAttempt;
import com.nexuslms.engine.models.SchoolClass;
import com.nexuslms.engine.models.Submission;
import com.nexuslms.engine.models.User;
import com.nexuslms.engine.repository.AssignmentRepository;
import com.nexuslms.engine.repository.CourseRepository;
import com.nexuslms.engine.repository.QuizAttemptRepository;
import com.nexuslms.engine.repository.QuizRepository;
import com.nexuslms.engine.repository.SchoolClassRepository;
import com.nexuslms.engine.repository.SubmissionRepository;
import com.nexuslms.engine.repository.UserRepository;
import com.nexuslms.engine.security.AuthUser;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

// Read-only views for a signed-in student. The student always comes from the token.
@Service
public class StudentService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final SchoolClassRepository classRepository;
    private final AssignmentRepository assignmentRepository;
    private final QuizRepository quizRepository;
    private final SubmissionRepository submissionRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    public StudentService(UserRepository userRepository, CourseRepository courseRepository,
                          SchoolClassRepository classRepository, AssignmentRepository assignmentRepository,
                          QuizRepository quizRepository, SubmissionRepository submissionRepository,
                          QuizAttemptRepository quizAttemptRepository) {
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.classRepository = classRepository;
        this.assignmentRepository = assignmentRepository;
        this.quizRepository = quizRepository;
        this.submissionRepository = submissionRepository;
        this.quizAttemptRepository = quizAttemptRepository;
    }

    /** Every published topic in the classes this student is enrolled in. */
    public List<StudentTopicResponse> myTopics(AuthUser auth) {
        User me = me(auth);

        // Cache the class names and teacher names so we don't refetch for every topic.
        Map<String, String> classNames = new HashMap<>();
        for (String classId : me.getClassIds()) {
            classRepository.findById(classId).ifPresent(c -> classNames.put(c.getId(), c.getName()));
        }
        Map<String, String> teacherNames = new HashMap<>();
        for (User u : userRepository.findAllByTenantIdAndRole(auth.tenantId(), "TEACHER")) {
            teacherNames.put(u.getId(), u.getName());
        }

        List<StudentTopicResponse> out = new ArrayList<>();
        for (String classId : me.getClassIds()) {
            for (Course c : courseRepository.findAllByClassId(classId)) {
                if (!c.isPublished()) continue;
                long aCount = assignmentRepository.countByCourseId(c.getId());
                long qCount = quizRepository.countQuizzesByCourseId(c.getId());
                out.add(new StudentTopicResponse(
                        c.getId(),
                        c.getTitle(),
                        c.getDescription(),
                        classNames.getOrDefault(c.getClassId(), ""),
                        teacherNames.getOrDefault(c.getTeacherId(), ""),
                        aCount,
                        qCount));
            }
        }
        out.sort(Comparator.comparing(StudentTopicResponse::title, String.CASE_INSENSITIVE_ORDER));
        return out;
    }

    /** Released scores only. Assignments always show (if graded); class tests/exams wait for release. */
    public StudentGradesResponse myGrades(AuthUser auth) {
        User me = me(auth);

        Map<String, String> classNames = new HashMap<>();
        for (String classId : me.getClassIds()) {
            classRepository.findById(classId).ifPresent(c -> classNames.put(c.getId(), c.getName()));
        }

        List<StudentGradesResponse.CourseGrades> courseGrades = new ArrayList<>();

        for (String classId : me.getClassIds()) {
            for (Course c : courseRepository.findAllByClassId(classId)) {
                if (!c.isPublished()) continue;

                List<StudentGradesResponse.GradeItem> items = new ArrayList<>();

                for (Assignment a : assignmentRepository.findAllByCourseId(c.getId())) {
                    Optional<Submission> s = submissionRepository
                            .findByAssignmentIdAndStudentId(a.getId(), me.getId());
                    if (s.isPresent() && s.get().isGraded()) {
                        items.add(new StudentGradesResponse.GradeItem(
                                a.getId(), a.getTitle(), "ASSIGNMENT",
                                s.get().getGrade(), a.getTotalMarks(), s.get().getFeedback()));
                    }
                }

                for (Quiz q : quizRepository.findAllQuizzesByCourseId(c.getId())) {
                    Optional<QuizAttempt> at = quizAttemptRepository
                            .findByQuizIdAndStudentId(q.getId(), me.getId());
                    if (at.isPresent() && at.get().isGraded() && q.isResultsReleased()) {
                        int total = totalMarks(q);
                        items.add(new StudentGradesResponse.GradeItem(
                                q.getId(), q.getTitle(), "QUIZ",
                                at.get().getScore(), total, null));
                    }
                }

                courseGrades.add(new StudentGradesResponse.CourseGrades(
                        c.getId(), c.getTitle(),
                        classNames.getOrDefault(c.getClassId(), ""),
                        items));
            }
        }
        courseGrades.sort(Comparator.comparing(StudentGradesResponse.CourseGrades::courseName, String.CASE_INSENSITIVE_ORDER));

        // Class-level tests and exams.
        List<StudentGradesResponse.ClassResult> classResults = new ArrayList<>();
        for (String classId : me.getClassIds()) {
            String className = classNames.getOrDefault(classId, "");
            addClassResults(me, classId, className, "TEST", classResults);
            addClassResults(me, classId, className, "EXAM", classResults);
        }

        return new StudentGradesResponse(courseGrades, classResults);
    }

    private void addClassResults(User me, String classId, String className, String category,
                                 List<StudentGradesResponse.ClassResult> out) {
        for (Quiz q : quizRepository.findAllByClassIdAndCategory(classId, category)) {
            Optional<QuizAttempt> at = quizAttemptRepository
                    .findByQuizIdAndStudentId(q.getId(), me.getId());
            if (at.isEmpty()) continue;
            boolean released = q.isResultsReleased();
            Integer score = (released && at.get().isGraded()) ? at.get().getScore() : null;
            out.add(new StudentGradesResponse.ClassResult(
                    q.getId(), q.getTitle(), className, category,
                    released, score, totalMarks(q)));
        }
    }

    private User me(AuthUser auth) {
        return userRepository.findById(auth.userId())
                .filter(u -> auth.tenantId().equals(u.getTenantId()))
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private int totalMarks(Quiz q) {
        return q.getQuestions().stream().mapToInt(x -> x.getMarks() != null ? x.getMarks() : 1).sum();
    }
}