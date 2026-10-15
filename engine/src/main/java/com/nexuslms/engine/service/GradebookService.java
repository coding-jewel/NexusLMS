package com.nexuslms.engine.service;

import com.nexuslms.engine.dto.GradebookResponse;
import com.nexuslms.engine.exception.NotFoundException;
import com.nexuslms.engine.models.Assignment;
import com.nexuslms.engine.models.Course;
import com.nexuslms.engine.models.Grade;
import com.nexuslms.engine.models.GradingWeights;
import com.nexuslms.engine.models.Quiz;
import com.nexuslms.engine.models.SchoolClass;
import com.nexuslms.engine.models.Tenant;
import com.nexuslms.engine.models.User;
import com.nexuslms.engine.repository.AssignmentRepository;
import com.nexuslms.engine.repository.CourseRepository;
import com.nexuslms.engine.repository.GradeRepository;
import com.nexuslms.engine.repository.QuizRepository;
import com.nexuslms.engine.repository.SchoolClassRepository;
import com.nexuslms.engine.repository.TenantRepository;
import com.nexuslms.engine.repository.UserRepository;
import com.nexuslms.engine.security.AuthUser;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GradebookService {

    private final CourseRepository courseRepository;
    private final SchoolClassRepository classRepository;
    private final UserRepository userRepository;
    private final AssignmentRepository assignmentRepository;
    private final QuizRepository quizRepository;
    private final GradeRepository gradeRepository;
    private final TenantRepository tenantRepository;

    public GradebookService(CourseRepository courseRepository, SchoolClassRepository classRepository,
                            UserRepository userRepository, AssignmentRepository assignmentRepository,
                            QuizRepository quizRepository, GradeRepository gradeRepository,
                            TenantRepository tenantRepository) {
        this.courseRepository = courseRepository;
        this.classRepository = classRepository;
        this.userRepository = userRepository;
        this.assignmentRepository = assignmentRepository;
        this.quizRepository = quizRepository;
        this.gradeRepository = gradeRepository;
        this.tenantRepository = tenantRepository;
    }

    public GradebookResponse forCourse(AuthUser auth, String courseId) {
        Course course = courseRepository.findById(courseId)
                .filter(c -> auth.tenantId().equals(c.getTenantId()))
                .filter(c -> auth.userId().equals(c.getTeacherId()))
                .orElseThrow(() -> new NotFoundException("Course not found"));
        SchoolClass schoolClass = classRepository.findById(course.getClassId())
                .orElseThrow(() -> new NotFoundException("Class not found"));

        List<Assignment> assignments = assignmentRepository.findAllByCourseId(courseId);
        List<Quiz> quizzes = quizRepository.findAllQuizzesByCourseId(courseId);
        List<User> students = userRepository.findStudentsInClass(course.getClassId());

        List<String> aIds = assignments.stream().map(Assignment::getId).toList();
        List<String> qIds = quizzes.stream().map(Quiz::getId).toList();
        Map<String, Grade> aLookup = index(gradeRepository.findAllByAssignmentIdIn(aIds), true);
        Map<String, Grade> qLookup = index(gradeRepository.findAllByQuizIdIn(qIds), false);

        GradebookResponse.Group aGroup = new GradebookResponse.Group("assignments", "Assignments",
                assignments.stream()
                        .map(a -> new GradebookResponse.Item(a.getId(), a.getTitle(), a.getTotalMarks()))
                        .toList());
        GradebookResponse.Group qGroup = new GradebookResponse.Group("quizzes", "Quizzes",
                quizzes.stream()
                        .map(q -> new GradebookResponse.Item(q.getId(), q.getTitle(), totalMarks(q)))
                        .toList());

        List<GradebookResponse.Row> rows = new ArrayList<>();
        for (User s : students) {
            Map<String, Integer> scores = new HashMap<>();
            double aEarned = 0, aPossible = 0;
            for (Assignment a : assignments) {
                Grade g = aLookup.get(s.getId() + ":" + a.getId());
                if (g != null && g.getScore() != null) {
                    scores.put(a.getId(), g.getScore());
                    aEarned += g.getScore();
                    aPossible += g.getTotalMarks() != null ? g.getTotalMarks() : a.getTotalMarks();
                }
            }
            double qEarned = 0, qPossible = 0;
            for (Quiz q : quizzes) {
                Grade g = qLookup.get(s.getId() + ":" + q.getId());
                if (g != null && g.getScore() != null) {
                    scores.put(q.getId(), g.getScore());
                    qEarned += g.getScore();
                    qPossible += g.getTotalMarks() != null ? g.getTotalMarks() : totalMarks(q);
                }
            }
            Map<String, Double> subtotals = new HashMap<>();
            subtotals.put("assignments", aPossible > 0 ? (aEarned / aPossible) * 100 : null);
            subtotals.put("quizzes", qPossible > 0 ? (qEarned / qPossible) * 100 : null);
            rows.add(new GradebookResponse.Row(s.getId(), s.getName(), scores, subtotals, null, false));
        }

        return new GradebookResponse("COURSE", course.getId(), course.getTitle(),
                schoolClass.getName(), List.of(aGroup, qGroup), rows);
    }

    public GradebookResponse forClass(AuthUser auth, String classId) {
        SchoolClass schoolClass = classRepository.findById(classId)
                .filter(c -> auth.tenantId().equals(c.getTenantId()))
                .orElseThrow(() -> new NotFoundException("Class not found"));

        boolean allowed = "ADMIN".equals(auth.role()) || userRepository.findById(auth.userId())
                .filter(u -> auth.tenantId().equals(u.getTenantId()))
                .map(u -> u.getClassIds().contains(schoolClass.getId()))
                .orElse(false);
        if (!allowed) {
            throw new NotFoundException("Class not found");
        }

        Tenant tenant = tenantRepository.findById(auth.tenantId())
                .orElseThrow(() -> new NotFoundException("School not found"));
        GradingWeights weights = tenant.getGradingWeights() != null
                ? tenant.getGradingWeights()
                : GradingWeights.DEFAULT;

        List<Quiz> tests = quizRepository.findAllByClassIdAndCategory(classId, "TEST");
        List<Quiz> exams = quizRepository.findAllByClassIdAndCategory(classId, "EXAM");
        List<User> students = userRepository.findStudentsInClass(classId);

        List<String> allIds = new ArrayList<>();
        tests.forEach(q -> allIds.add(q.getId()));
        exams.forEach(q -> allIds.add(q.getId()));
        Map<String, Grade> lookup = index(gradeRepository.findAllByQuizIdIn(allIds), false);

        GradebookResponse.Group tGroup = new GradebookResponse.Group("tests", "Tests",
                tests.stream().map(q -> new GradebookResponse.Item(q.getId(), q.getTitle(), totalMarks(q))).toList());
        GradebookResponse.Group eGroup = new GradebookResponse.Group("exams", "Exams",
                exams.stream().map(q -> new GradebookResponse.Item(q.getId(), q.getTitle(), totalMarks(q))).toList());

        List<GradebookResponse.Row> rows = new ArrayList<>();
        for (User s : students) {
            Map<String, Integer> scores = new HashMap<>();

            double tEarned = 0, tPossible = 0;
            for (Quiz q : tests) {
                Grade g = lookup.get(s.getId() + ":" + q.getId());
                if (g != null && g.getScore() != null) {
                    scores.put(q.getId(), g.getScore());
                    tEarned += g.getScore();
                    tPossible += g.getTotalMarks() != null ? g.getTotalMarks() : totalMarks(q);
                }
            }
            double eEarned = 0, ePossible = 0;
            for (Quiz q : exams) {
                Grade g = lookup.get(s.getId() + ":" + q.getId());
                if (g != null && g.getScore() != null) {
                    scores.put(q.getId(), g.getScore());
                    eEarned += g.getScore();
                    ePossible += g.getTotalMarks() != null ? g.getTotalMarks() : totalMarks(q);
                }
            }

            Double tPct = tPossible > 0 ? (tEarned / tPossible) * 100 : null;
            Double ePct = ePossible > 0 ? (eEarned / ePossible) * 100 : null;

            Map<String, Double> subtotals = new HashMap<>();
            subtotals.put("tests", tPct);
            subtotals.put("exams", ePct);

            Double overall = null;
            double weightSum = 0, weightedSum = 0;
            if (tPct != null) { weightSum += weights.tests(); weightedSum += tPct * weights.tests(); }
            if (ePct != null) { weightSum += weights.exams(); weightedSum += ePct * weights.exams(); }
            if (weightSum > 0) overall = weightedSum / weightSum;

            boolean provisional = tPct == null || ePct == null;
            rows.add(new GradebookResponse.Row(s.getId(), s.getName(), scores, subtotals, overall, provisional));
        }

        return new GradebookResponse("CLASS", schoolClass.getId(), schoolClass.getName(),
                schoolClass.getName(), List.of(tGroup, eGroup), rows);
    }

    private Map<String, Grade> index(List<Grade> grades, boolean byAssignment) {
        Map<String, Grade> out = new HashMap<>();
        for (Grade g : grades) {
            String itemId = byAssignment ? g.getAssignmentId() : g.getQuizId();
            if (itemId != null) out.put(g.getStudentId() + ":" + itemId, g);
        }
        return out;
    }

    private int totalMarks(Quiz q) {
        return q.getQuestions().stream().mapToInt(x -> x.getMarks() != null ? x.getMarks() : 1).sum();
    }
}