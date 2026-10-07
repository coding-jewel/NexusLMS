package com.nexuslms.engine.service;

import com.nexuslms.engine.exception.DuplicateResourceException;
import com.nexuslms.engine.exception.InvalidRequestException;
import com.nexuslms.engine.exception.NotFoundException;
import com.nexuslms.engine.models.Role;
import com.nexuslms.engine.models.User;
import com.nexuslms.engine.repository.CourseRepository;
import com.nexuslms.engine.repository.UserRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CourseRepository courseRepository;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, CourseRepository courseRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.courseRepository = courseRepository;
    }

    public User createUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return createUserHashed(user);
    }

    /**
     * Saves a user whose password is already hashed (for example one held in a pending registration).
     * An admin's email can't be used by anyone else, and an email already used by an admin can't join as anyone else.
     */
    public User createUserHashed(User user) {
        user.setEmail(user.getEmail().trim().toLowerCase());

        boolean emailTaken = user.getRole() == Role.ADMIN
                ? userRepository.existsByEmail(user.getEmail())
                : userRepository.existsByEmailAndRole(user.getEmail(), Role.ADMIN.name());
        if (emailTaken) {
            throw new DuplicateResourceException("This email is already in use");
        }
        if (userRepository.existsByEmailAndTenantId(user.getEmail(), user.getTenantId())) {
            throw new DuplicateResourceException("Email already in use in this tenant");
        }
        try {
            return userRepository.save(user);
        } catch (DuplicateKeyException e) {
            throw new DuplicateResourceException("This email is already in use");
        }
    }

    public boolean isEmailInUse(String email) {
        return userRepository.existsByEmail(email.trim().toLowerCase());
    }

    // --- the admin's view of their own school ---
    // These take the school from the signed-in user. A user from another school looks like a user who doesn't exist.

    /** Everyone in the school, optionally only one role and/or one class (anyone who belongs to it), sorted by name. */
    public List<User> list(String tenantId, String role, String classId) {
        Role wanted = null;
        if (role != null && !role.isBlank()) {
            try {
                wanted = Role.valueOf(role.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new InvalidRequestException("Role must be ADMIN, TEACHER or STUDENT");
            }
        }
        List<User> users = wanted == null
                ? userRepository.findAllByTenantId(tenantId)
                : userRepository.findAllByTenantIdAndRole(tenantId, wanted.name());
        return users.stream()
                .filter(u -> classId == null || classId.isBlank() || u.getClassIds().contains(classId))
                .sorted(Comparator.comparing(User::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public User get(String tenantId, String id) {
        return userRepository.findById(id)
                .filter(u -> tenantId.equals(u.getTenantId()))
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    public void remove(String tenantId, String id) {
        User user = get(tenantId, id);
        if (user.getRole() == Role.ADMIN) {
            throw new InvalidRequestException("An admin account can't be deleted here.");
        }
        if (user.getRole() == Role.TEACHER && courseRepository.existsByTeacherId(user.getId())) {
            throw new InvalidRequestException("This teacher still has courses. Delete them first.");
        }
        userRepository.deleteById(user.getId());
    }

    /** A teacher who joined with the school's code waits until the admin approves them. */
    public User approve(String tenantId, String id) {
        User teacher = waitingTeacher(tenantId, id);
        teacher.setApproved(true);
        return userRepository.save(teacher);
    }

    /** Declining deletes the request, so the person can apply again with the right details. */
    public void decline(String tenantId, String id) {
        userRepository.deleteById(waitingTeacher(tenantId, id).getId());
    }

    // Only a teacher who is still waiting can be approved or declined. Anyone else is refused,
    // so "decline" can never be used to delete an approved teacher or a student.
    private User waitingTeacher(String tenantId, String id) {
        User user = get(tenantId, id);
        if (user.getRole() != Role.TEACHER || user.isApproved()) {
            throw new InvalidRequestException("This person isn't waiting for approval.");
        }
        return user;
    }

    // Not scoped to a school. Nothing in the controllers uses these any more, only the tests and registration.
    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByEmailAndTenant(String email, String tenantId) {
        return userRepository.findByEmailAndTenantId(email, tenantId);
    }
}