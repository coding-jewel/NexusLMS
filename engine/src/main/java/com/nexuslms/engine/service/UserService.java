package com.nexuslms.engine.service;

import com.nexuslms.engine.exception.DuplicateResourceException;
import com.nexuslms.engine.models.Role;
import com.nexuslms.engine.models.User;
import com.nexuslms.engine.repository.UserRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
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

    public List<User> getAllUsersByTenant(String tenantId) {
        return userRepository.findAllByTenantId(tenantId);
    }

    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByEmailAndTenant(String email, String tenantId) {
        return userRepository.findByEmailAndTenantId(email, tenantId);
    }

    public List<User> getUsersByRole(String tenantId, String role) {
        return userRepository.findAllByTenantIdAndRole(tenantId, role);
    }

    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }
}