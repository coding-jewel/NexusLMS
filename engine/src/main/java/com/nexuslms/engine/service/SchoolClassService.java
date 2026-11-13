package com.nexuslms.engine.service;

import com.nexuslms.engine.dto.ClassGradebookResponse;
import com.nexuslms.engine.dto.ClassPeopleResponse;
import com.nexuslms.engine.dto.ClassRequest;
import com.nexuslms.engine.dto.ClassResponse;
import com.nexuslms.engine.dto.UserResponse;
import com.nexuslms.engine.exception.DuplicateResourceException;
import com.nexuslms.engine.exception.InvalidRequestException;
import com.nexuslms.engine.exception.NotFoundException;
import com.nexuslms.engine.models.*;
import com.nexuslms.engine.repository.*;
import com.nexuslms.engine.security.AuthUser;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SchoolClassService {

    private final SchoolClassRepository classRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final AssignmentRepository assignmentRepository;
    private final QuizRepository quizRepository;
    private final GradeRepository gradeRepository;
    
    // NEW: Added for cascade deletion
    private final SubmissionRepository submissionRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    public SchoolClassService(SchoolClassRepository classRepository, UserRepository userRepository,
                              CourseRepository courseRepository, AssignmentRepository assignmentRepository,
                              QuizRepository quizRepository, GradeRepository gradeRepository,
                              SubmissionRepository submissionRepository, QuizAttemptRepository quizAttemptRepository) {
        this.classRepository = classRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.assignmentRepository = assignmentRepository;
        this.quizRepository = quizRepository;
        this.gradeRepository = gradeRepository;
        this.submissionRepository = submissionRepository;
        this.quizAttemptRepository = quizAttemptRepository;
    }

    public ClassResponse create(String tenantId, ClassRequest request) {
        String name = request.name().trim();
        if (classRepository.existsByNameAndTenantId(name, tenantId)) {
            throw new DuplicateResourceException("A class with this name already exists");
        }
        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setTenantId(tenantId);
        schoolClass.setName(name);
        schoolClass.setDescription(request.description() == null ? null : request.description().trim());
        return toResponse(tenantId, saveWithNewCode(schoolClass));
    }

    public ClassResponse update(String tenantId, String id, ClassRequest request) {
        SchoolClass schoolClass = owned(tenantId, id);

        String newName = request.name().trim();
        if (!schoolClass.getName().equals(newName) && classRepository.existsByNameAndTenantId(newName, tenantId)) {
            throw new DuplicateResourceException("A class with this name already exists");
        }

        schoolClass.setName(newName);
        schoolClass.setDescription(request.description() == null ? null : request.description().trim());
        classRepository.save(schoolClass);

        return toResponse(tenantId, schoolClass);
    }

    public List<ClassResponse> list(String tenantId) {
        return classRepository.findAllByTenantId(tenantId).stream()
                .sorted(Comparator.comparing(SchoolClass::getName, String.CASE_INSENSITIVE_ORDER))
                .map(c -> toResponse(tenantId, c))
                .toList();
    }

    public ClassResponse getClass(String tenantId, String id, AuthUser auth) {
        SchoolClass schoolClass = owned(tenantId, id);
        verifyClassAccess(tenantId, schoolClass, auth);
        return toResponse(tenantId, schoolClass);
    }

    public ClassPeopleResponse getClassPeople(String tenantId, String id, AuthUser auth) {
        SchoolClass schoolClass = owned(tenantId, id);
        verifyClassAccess(tenantId, schoolClass, auth);

        List<UserResponse> teachers = userRepository.findTeachersInClass(tenantId, schoolClass.getId())
                .stream().map(UserResponse::from).toList();

        List<UserResponse> students = userRepository.findStudentsInClass(schoolClass.getId())
                .stream()
                .sorted(Comparator.comparing(User::getName, String.CASE_INSENSITIVE_ORDER))
                .map(UserResponse::from)
                .toList();

        return new ClassPeopleResponse(teachers, students);
    }

    public ClassGradebookResponse getClassGradebook(String tenantId, String classId, AuthUser auth) {
        SchoolClass schoolClass = owned(tenantId, classId);
        verifyClassAccess(tenantId, schoolClass, auth);

        List<Course> topics = courseRepository.findAllByClassId(classId);
        List<Quiz> exams = quizRepository.findAllByClassIdAndCategory(classId, "EXAM");
        List<User> students = userRepository.findStudentsInClass(classId);

        List<String> allAssignmentIds = new ArrayList<>();
        List<String> allQuizIds = new ArrayList<>();
        List<String> allExamIds = new ArrayList<>();

        for (Course topic : topics) {
            assignmentRepository.findAllByCourseId(topic.getId()).forEach(a -> allAssignmentIds.add(a.getId()));
            quizRepository.findAllQuizzesByCourseId(topic.getId()).forEach(q -> allQuizIds.add(q.getId()));
        }
        exams.forEach(q -> allExamIds.add(q.getId()));

        List<Grade> allGrades = new ArrayList<>();
        if (!allAssignmentIds.isEmpty()) allGrades.addAll(gradeRepository.findAllByAssignmentIdIn(allAssignmentIds));
        if (!allQuizIds.isEmpty()) allGrades.addAll(gradeRepository.findAllByQuizIdIn(allQuizIds));
        if (!allExamIds.isEmpty()) allGrades.addAll(gradeRepository.findAllByQuizIdIn(allExamIds));

        Map<String, List<Grade>> gradesByStudent = new HashMap<>();
        for (Grade g : allGrades) {
            gradesByStudent.computeIfAbsent(g.getStudentId(), k -> new ArrayList<>()).add(g);
        }

        List<ClassGradebookResponse.StudentRow> rows = new ArrayList<>();
        boolean isWeighted = "WEIGHTED".equals(schoolClass.getGradingMethod());

        for (User student : students) {
            List<Grade> sGrades = gradesByStudent.getOrDefault(student.getId(), new ArrayList<>());

            double assignEarned = 0, assignPossible = 0;
            double quizEarned = 0, quizPossible = 0;
            double examEarned = 0, examPossible = 0;

            for (Grade g : sGrades) {
                if (g.getScore() == null) continue;

                double score = g.getScore();
                double total = g.getTotalMarks() != null ? g.getTotalMarks() : 0;

                if (g.getType() == GradeType.ASSIGNMENT) {
                    assignEarned += score; assignPossible += total;
                } else if (g.getType() == GradeType.QUIZ) {
                    quizEarned += score; quizPossible += total;
                } else if (g.getType() == GradeType.EXAM) {
                    examEarned += score; examPossible += total;
                }
            }

            Double aPct = assignPossible > 0 ? (assignEarned / assignPossible) * 100 : null;
            Double qPct = quizPossible > 0 ? (quizEarned / quizPossible) * 100 : null;
            Double ePct = examPossible > 0 ? (examEarned / examPossible) * 100 : null;

            Double overall = null;
            if (isWeighted) {
                double weightSum = 0, weightedSum = 0;
                if (aPct != null) { weightSum += schoolClass.getAssignmentWeight(); weightedSum += aPct * schoolClass.getAssignmentWeight(); }
                if (qPct != null) { weightSum += schoolClass.getQuizWeight(); weightedSum += qPct * schoolClass.getQuizWeight(); }
                if (ePct != null) { weightSum += schoolClass.getExamWeight(); weightedSum += ePct * schoolClass.getExamWeight(); }
                if (weightSum > 0) overall = weightedSum / weightSum;
            } else {
                double totalEarned = assignEarned + quizEarned + examEarned;
                double totalPossible = assignPossible + quizPossible + examPossible;
                if (totalPossible > 0) overall = (totalEarned / totalPossible) * 100;
            }

            rows.add(new ClassGradebookResponse.StudentRow(
                    student.getId(), student.getName(), aPct, qPct, ePct, overall
            ));
        }

        return new ClassGradebookResponse(rows, schoolClass.getGradingMethod());
    }

    public ClassResponse updateGradingSettings(String tenantId, String id, AuthUser auth, String method, int aWeight, int qWeight, int eWeight) {
        SchoolClass schoolClass = owned(tenantId, id);
        verifyClassAccess(tenantId, schoolClass, auth);

        if (aWeight + qWeight + eWeight != 100) {
            throw new InvalidRequestException("Weights must add up to exactly 100%.");
        }

        schoolClass.setGradingMethod(method);
        schoolClass.setAssignmentWeight(aWeight);
        schoolClass.setQuizWeight(qWeight);
        schoolClass.setExamWeight(eWeight);
        classRepository.save(schoolClass);

        return toResponse(tenantId, schoolClass);
    }

    private void verifyClassAccess(String tenantId, SchoolClass schoolClass, AuthUser auth) {
        if ("ADMIN".equals(auth.role())) return;
        boolean assigned = userRepository.findById(auth.userId())
                .filter(u -> tenantId.equals(u.getTenantId()))
                .map(u -> u.getClassIds().contains(schoolClass.getId()))
                .orElse(false);
        if (!assigned) throw new NotFoundException("Class not found");
    }

    public ClassResponse regenerateCode(String tenantId, String id) {
        return toResponse(tenantId, saveWithNewCode(owned(tenantId, id)));
    }

    public void delete(String tenantId, String id) {
        SchoolClass schoolClass = owned(tenantId, id);
        if (userRepository.existsByClassId(schoolClass.getId())) {
            throw new InvalidRequestException("This class still has students. Remove them first.");
        }
        classRepository.deleteById(schoolClass.getId());
    }

    public ClassResponse assignTeacher(String tenantId, String classId, String teacherId) {
        SchoolClass schoolClass = owned(tenantId, classId);
        User teacher = teacherOfSchool(tenantId, teacherId);
        List<String> classIds = new ArrayList<>(teacher.getClassIds());
        if (!classIds.contains(schoolClass.getId())) {
            classIds.add(schoolClass.getId());
            teacher.setClassIds(classIds);
            userRepository.save(teacher);
        }
        return toResponse(tenantId, schoolClass);
    }

    public ClassResponse removeTeacher(String tenantId, String classId, String teacherId) {
        SchoolClass schoolClass = owned(tenantId, classId);
        User teacher = teacherOfSchool(tenantId, teacherId);
        List<String> classIds = new ArrayList<>(teacher.getClassIds());
        if (classIds.remove(schoolClass.getId())) {
            teacher.setClassIds(classIds);
            userRepository.save(teacher);
        }
        return toResponse(tenantId, schoolClass);
    }

    public List<UserResponse> students(String tenantId, String classId, AuthUser auth) {
        SchoolClass schoolClass = owned(tenantId, classId);
        verifyClassAccess(tenantId, schoolClass, auth);
        return userRepository.findStudentsInClass(classId).stream()
                .sorted(Comparator.comparing(User::getName, String.CASE_INSENSITIVE_ORDER))
                .map(UserResponse::from)
                .toList();
    }

    // FIXED: Added @Transactional and the cascade delete call
    @Transactional
    public void removeStudent(String tenantId, String classId, String studentId) {
        owned(tenantId, classId);
        User student = userRepository.findById(studentId)
                .filter(u -> tenantId.equals(u.getTenantId()))
                .filter(u -> u.getRole() == Role.STUDENT)
                .orElseThrow(() -> new NotFoundException("Student not found"));

        List<String> classIds = new ArrayList<>(student.getClassIds());
        if (classIds.remove(classId)) {
            student.setClassIds(classIds);
            userRepository.save(student);

            // NEW: Cascade delete their submissions, attempts, and grades
            cascadeDeleteStudentData(classId, studentId);
        }
    }

    // NEW: Helper method to cleanly delete all related data
    private void cascadeDeleteStudentData(String classId, String studentId) {
        List<Course> courses = courseRepository.findAllByClassId(classId);
        List<String> assignmentIds = new ArrayList<>();
        List<String> quizIds = new ArrayList<>();

        for (Course course : courses) {
            assignmentRepository.findAllByCourseId(course.getId()).forEach(a -> assignmentIds.add(a.getId()));
            quizRepository.findAllQuizzesByCourseId(course.getId()).forEach(q -> quizIds.add(q.getId()));
        }
        
        // Add class-level Exams
        quizRepository.findAllByClassIdAndCategory(classId, "EXAM").forEach(q -> quizIds.add(q.getId()));

        if (!assignmentIds.isEmpty()) {
            submissionRepository.deleteByStudentIdAndAssignmentIdIn(studentId, assignmentIds);
            gradeRepository.deleteByStudentIdAndAssignmentIdIn(studentId, assignmentIds);
        }

        if (!quizIds.isEmpty()) {
            quizAttemptRepository.deleteByStudentIdAndQuizIdIn(studentId, quizIds);
            gradeRepository.deleteByStudentIdAndQuizIdIn(studentId, quizIds);
        }
    }

    private SchoolClass owned(String tenantId, String id) {
        return classRepository.findById(id)
                .filter(c -> tenantId.equals(c.getTenantId()))
                .orElseThrow(() -> new NotFoundException("Class not found"));
    }

    private User teacherOfSchool(String tenantId, String teacherId) {
        return userRepository.findById(teacherId)
                .filter(u -> tenantId.equals(u.getTenantId()))
                .filter(u -> u.getRole() == Role.TEACHER)
                .orElseThrow(() -> new NotFoundException("Teacher not found"));
    }

    private ClassResponse toResponse(String tenantId, SchoolClass schoolClass) {
        List<String> teacherIds = userRepository.findTeachersInClass(tenantId, schoolClass.getId())
                .stream().map(User::getId).toList();
        long studentCount = userRepository.countStudentsInClass(schoolClass.getId());
        return ClassResponse.from(schoolClass, teacherIds, studentCount);
    }

    private SchoolClass saveWithNewCode(SchoolClass schoolClass) {
        for (int attempt = 0; attempt < 10; attempt++) {
            String code = ClassCodes.generate(schoolClass.getName());
            if (classRepository.existsByCode(code)) continue;
            schoolClass.setCode(code);
            try {
                return classRepository.save(schoolClass);
            } catch (DuplicateKeyException e) {
                // loop
            }
        }
        throw new IllegalStateException("Could not create a unique class code");
    }
}