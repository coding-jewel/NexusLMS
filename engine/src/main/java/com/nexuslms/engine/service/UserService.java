package com.nexuslms.engine.service;

import com.nexuslms.engine.exception.DuplicateResourceException;
import com.nexuslms.engine.models.User;
import com.nexuslms.engine.repository.UserRepository;
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
        if (userRepository.existsByEmailAndTenantId(user.getEmail(), user.getTenantId())) {
            throw new DuplicateResourceException("Email already in use in this tenant");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
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
