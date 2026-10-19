package com.nexuslms.engine.service;

import com.nexuslms.engine.dto.StudentAssessmentResponse;
import com.nexuslms.engine.dto.StudentClassResponse;
import com.nexuslms.engine.dto.StudentGradesResponse;
import com.nexuslms.engine.dto.StudentTodoResponse;
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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

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

    public void joinClass(AuthUser auth, String rawCode) {
        String code = ClassCodes.normalize(rawCode);
        SchoolClass schoolClass = classRepository.findByCode(code)
                .orElseThrow(() -> new NotFoundException("Invalid class code."));

        if (!auth.tenantId().equals(schoolClass.getTenantId())) {
            throw new NotFoundException("Invalid class code.");
        }

        User me = me(auth);
        if (!me.getClassIds().contains(schoolClass.getId())) {
            me.getClassIds().add(schoolClass.getId());
            userRepository.save(me);
        }
    }

    /** Everything the student hasn't done yet. Sorted by soonest due date. */
    public List<StudentTodoResponse> myTodo(AuthUser auth) {
        User me = me(auth);
        LocalDateTime now = LocalDateTime.now();
        List<StudentTodoResponse> out = new ArrayList<>();

        // Cache of what they've already done.
        Set<String> submittedAssignmentIds = new HashSet<>();
        for (Submission s : submissionRepository.findAllByStudentId(me.getId())) {
            submittedAssignmentIds.add(s.getAssignmentId());
        }
        Set<String> attemptedQuizIds = new HashSet<>();
        for (QuizAttempt a : quizAttemptRepository.findAllByStudentId(me.getId())) {
            attemptedQuizIds.add(a.getQuizId());
        }

        Map<String, String> classNames = new HashMap<>();
        for (String classId : me.getClassIds()) {
            classRepository.findById(classId).ifPresent(c -> classNames.put(c.getId(), c.getName()));
        }

        for (String classId : me.getClassIds()) {
            String className = classNames.getOrDefault(classId, "");

            // Assignments and topic quizzes
            for (Course c : courseRepository.findAllByClassId(classId)) {
                if (!c.isPublished()) continue;

                for (Assignment a : assignmentRepository.findAllByCourseId(c.getId())) {
                    if (!submittedAssignmentIds.contains(a.getId())) {
                        boolean overdue = a.getDueDate() != null && now.isAfter(a.getDueDate());
                        out.add(new StudentTodoResponse(
                                a.getId(), "ASSIGNMENT", a.getTitle(), className, c.getTitle(), c.getId(),
                                a.getDueDate(), overdue));
                    }
                }

                for (Quiz q : quizRepository.findPublishedQuizzesByCourseId(c.getId())) {
                    if (!attemptedQuizIds.contains(q.getId())) {
                        out.add(new StudentTodoResponse(
                                q.getId(), "QUIZ", q.getTitle(), className, c.getTitle(), c.getId(),
                                null, false));
                    }
                }
            }

            // Class-level tests and exams
            for (Quiz q : quizRepository.findPublishedByClassIdAndCategory(classId, "TEST")) {
                if (!attemptedQuizIds.contains(q.getId())) {
                    out.add(new StudentTodoResponse(
                            q.getId(), "TEST", q.getTitle(), className, null, null, null, false));
                }
            }
            for (Quiz q : quizRepository.findPublishedByClassIdAndCategory(classId, "EXAM")) {
                if (!attemptedQuizIds.contains(q.getId())) {
                    out.add(new StudentTodoResponse(
                            q.getId(), "EXAM", q.getTitle(), className, null, null, null, false));
                }
            }
        }

        // Sort: Overdue first, then by due date (nulls last), then by title
        out.sort(Comparator
                .comparing(StudentTodoResponse::overdue).reversed()
                .thenComparing(StudentTodoResponse::dueDate, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(StudentTodoResponse::title, String.CASE_INSENSITIVE_ORDER));

        return out;
    }

    public List<StudentClassResponse> myClasses(AuthUser auth) {
        User me = me(auth);

        Map<String, String> teacherNames = new HashMap<>();
        for (User u : userRepository.findAllByTenantIdAndRole(auth.tenantId(), "TEACHER")) {
            teacherNames.put(u.getId(), u.getName());
        }

        List<StudentClassResponse> out = new ArrayList<>();
        for (String classId : me.getClassIds()) {
            Optional<SchoolClass> opt = classRepository.findById(classId);
            if (opt.isEmpty()) continue;
            SchoolClass sc = opt.get();

            List<StudentTopicResponse> topics = new ArrayList<>();
            for (Course c : courseRepository.findAllByClassId(classId)) {
                if (!c.isPublished()) continue;
                long aCount = assignmentRepository.countByCourseId(c.getId());
                long qCount = quizRepository.countPublishedQuizzesByCourseId(c.getId());
                topics.add(new StudentTopicResponse(
                        c.getId(), c.getTitle(), c.getDescription(),
                        sc.getName(), teacherNames.getOrDefault(c.getTeacherId(), ""),
                        aCount, qCount));
            }
            topics.sort(Comparator.comparing(StudentTopicResponse::title, String.CASE_INSENSITIVE_ORDER));

            out.add(new StudentClassResponse(sc.getId(), sc.getName(), topics));
        }

        out.sort(Comparator.comparing(StudentClassResponse::name, String.CASE_INSENSITIVE_ORDER));
        return out;
    }

    public List<StudentTopicResponse> myTopics(AuthUser auth) {
        User me = me(auth);
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
                long qCount = quizRepository.countPublishedQuizzesByCourseId(c.getId());
                out.add(new StudentTopicResponse(
                        c.getId(), c.getTitle(), c.getDescription(),
                        classNames.getOrDefault(c.getClassId(), ""),
                        teacherNames.getOrDefault(c.getTeacherId(), ""),
                        aCount, qCount));
            }
        }
        out.sort(Comparator.comparing(StudentTopicResponse::title, String.CASE_INSENSITIVE_ORDER));
        return out;
    }

    public List<StudentAssessmentResponse> myAssessments(AuthUser auth) {
        User me = me(auth);
        Map<String, String> classNames = new HashMap<>();
        for (String classId : me.getClassIds()) {
            classRepository.findById(classId).ifPresent(c -> classNames.put(c.getId(), c.getName()));
        }

        List<StudentAssessmentResponse> out = new ArrayList<>();
        for (String classId : me.getClassIds()) {
            String className = classNames.getOrDefault(classId, "");
            addAssessmentsForClass(me, classId, className, "TEST", out);
            addAssessmentsForClass(me, classId, className, "EXAM", out);
        }

        out.sort(Comparator
                .comparing(StudentAssessmentResponse::className, String.CASE_INSENSITIVE_ORDER)
                .thenComparing(StudentAssessmentResponse::category)
                .thenComparing(StudentAssessmentResponse::title, String.CASE_INSENSITIVE_ORDER));
        return out;
    }

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
                    Optional<Submission> s = submissionRepository.findByAssignmentIdAndStudentId(a.getId(), me.getId());
                    if (s.isPresent() && s.get().isGraded()) {
                        items.add(new StudentGradesResponse.GradeItem(
                                a.getId(), a.getTitle(), "ASSIGNMENT",
                                s.get().getGrade(), a.getTotalMarks(), s.get().getFeedback()));
                    }
                }

                for (Quiz q : quizRepository.findPublishedQuizzesByCourseId(c.getId())) {
                    Optional<QuizAttempt> at = quizAttemptRepository.findByQuizIdAndStudentId(q.getId(), me.getId());
                    if (at.isPresent() && at.get().isGraded() && q.isResultsReleased()) {
                        items.add(new StudentGradesResponse.GradeItem(
                                q.getId(), q.getTitle(), "QUIZ",
                                at.get().getScore(), q.effectiveTotalMarks(), null));
                    }
                }

                courseGrades.add(new StudentGradesResponse.CourseGrades(
                        c.getId(), c.getTitle(), classNames.getOrDefault(c.getClassId(), ""), items));
            }
        }
        courseGrades.sort(Comparator.comparing(StudentGradesResponse.CourseGrades::courseName, String.CASE_INSENSITIVE_ORDER));

        List<StudentGradesResponse.ClassResult> classResults = new ArrayList<>();
        for (String classId : me.getClassIds()) {
            String className = classNames.getOrDefault(classId, "");
            addClassResults(me, classId, className, "TEST", classResults);
            addClassResults(me, classId, className, "EXAM", classResults);
        }

        return new StudentGradesResponse(courseGrades, classResults);
    }

    private void addAssessmentsForClass(User me, String classId, String className, String category,
                                        List<StudentAssessmentResponse> out) {
        for (Quiz q : quizRepository.findPublishedByClassIdAndCategory(classId, category)) {
            boolean attempted = quizAttemptRepository.findByQuizIdAndStudentId(q.getId(), me.getId()).isPresent();
            out.add(new StudentAssessmentResponse(
                    q.getId(), q.getTitle(), className, category,
                    q.getTimeLimitMinutes(), q.effectiveTotalMarks(),
                    attempted, q.isResultsReleased()));
        }
    }

    private void addClassResults(User me, String classId, String className, String category,
                                 List<StudentGradesResponse.ClassResult> out) {
        for (Quiz q : quizRepository.findPublishedByClassIdAndCategory(classId, category)) {
            Optional<QuizAttempt> at = quizAttemptRepository.findByQuizIdAndStudentId(q.getId(), me.getId());
            if (at.isEmpty()) continue;
            boolean released = q.isResultsReleased();
            Integer score = (released && at.get().isGraded()) ? at.get().getScore() : null;
            out.add(new StudentGradesResponse.ClassResult(
                    q.getId(), q.getTitle(), className, category,
                    released, score, q.effectiveTotalMarks()));
        }
    }

    private User me(AuthUser auth) {
        return userRepository.findById(auth.userId())
                .filter(u -> auth.tenantId().equals(u.getTenantId()))
                .orElseThrow(() -> new NotFoundException("User not found"));
    }
}