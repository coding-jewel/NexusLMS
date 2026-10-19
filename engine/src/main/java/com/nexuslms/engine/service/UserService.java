package com.nexuslms.engine.service;

import com.nexuslms.engine.dto.ChangePasswordRequest;
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

    public User approve(String tenantId, String id) {
        User teacher = waitingTeacher(tenantId, id);
        teacher.setApproved(true);
        return userRepository.save(teacher);
    }

    public void decline(String tenantId, String id) {
        userRepository.deleteById(waitingTeacher(tenantId, id).getId());
    }

    private User waitingTeacher(String tenantId, String id) {
        User user = get(tenantId, id);
        if (user.getRole() != Role.TEACHER || user.isApproved()) {
            throw new InvalidRequestException("This person isn't waiting for approval.");
        }
        return user;
    }

    // --- settings ---

    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new InvalidRequestException("Your current password is incorrect.");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByEmailAndTenant(String email, String tenantId) {
        return userRepository.findByEmailAndTenantId(email, tenantId);
    }
}