package com.nexuslms.engine.service;

import com.nexuslms.engine.dto.ClassRequest;
import com.nexuslms.engine.dto.ClassResponse;
import com.nexuslms.engine.dto.UserResponse;
import com.nexuslms.engine.exception.DuplicateResourceException;
import com.nexuslms.engine.exception.InvalidRequestException;
import com.nexuslms.engine.exception.NotFoundException;
import com.nexuslms.engine.models.Role;
import com.nexuslms.engine.models.SchoolClass;
import com.nexuslms.engine.models.User;
import com.nexuslms.engine.repository.SchoolClassRepository;
import com.nexuslms.engine.repository.UserRepository;
import com.nexuslms.engine.security.AuthUser;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

// Every method takes the school from the signed-in user, never from the request.
@Service
public class SchoolClassService {

    private final SchoolClassRepository classRepository;
    private final UserRepository userRepository;

    public SchoolClassService(SchoolClassRepository classRepository, UserRepository userRepository) {
        this.classRepository = classRepository;
        this.userRepository = userRepository;
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

    public List<ClassResponse> list(String tenantId) {
        return classRepository.findAllByTenantId(tenantId).stream()
                .sorted(Comparator.comparing(SchoolClass::getName, String.CASE_INSENSITIVE_ORDER))
                .map(c -> toResponse(tenantId, c))
                .toList();
    }

    public ClassResponse regenerateCode(String tenantId, String id) {
        return toResponse(tenantId, saveWithNewCode(owned(tenantId, id)));
    }

    public void delete(String tenantId, String id) {
        SchoolClass schoolClass = owned(tenantId, id);
        if (userRepository.existsByClassId(schoolClass.getId())) {
            throw new InvalidRequestException("This class still has students. Remove them first.");
        }
        // TODO(courses step): also refuse when the class still has courses
        classRepository.deleteById(schoolClass.getId());
    }

    // --- teachers of a class ---

    /** Adds a teacher to this class. Idempotent: a teacher already in it is a no-op. */
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

    /**
     * Removes a teacher from this class. Their existing courses in it survive; only the
     * assignment goes away. New courses can't be created here until they're assigned again.
     */
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

    // --- students of a class ---

    /**
     * Students in a class. Available to admins and to teachers assigned to that class.
     * Used by the mark-submissions and mark-quiz pages to show names next to student ids.
     */
    public List<UserResponse> students(String tenantId, String classId, AuthUser auth) {
        SchoolClass schoolClass = owned(tenantId, classId);
        if (!"ADMIN".equals(auth.role())) {
            boolean assigned = userRepository.findById(auth.userId())
                    .filter(u -> tenantId.equals(u.getTenantId()))
                    .map(u -> u.getClassIds().contains(schoolClass.getId()))
                    .orElse(false);
            if (!assigned) {
                throw new NotFoundException("Class not found");
            }
        }
        return userRepository.findStudentsInClass(classId).stream()
                .sorted(Comparator.comparing(User::getName, String.CASE_INSENSITIVE_ORDER))
                .map(UserResponse::from)
                .toList();
    }

    // --- helpers ---

    // A class from another school looks exactly like a class that doesn't exist.
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
            if (classRepository.existsByCode(code)) {
                continue;
            }
            schoolClass.setCode(code);
            try {
                return classRepository.save(schoolClass);
            } catch (DuplicateKeyException e) {
                // someone else got that code at the same moment; try another
            }
        }
        throw new IllegalStateException("Could not create a unique class code");
    }
}