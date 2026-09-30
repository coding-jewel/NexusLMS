package com.nexuslms.engine;

import com.nexuslms.engine.exception.DuplicateResourceException;
import com.nexuslms.engine.models.Role;
import com.nexuslms.engine.models.User;
import com.nexuslms.engine.repository.UserRepository;
import com.nexuslms.engine.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId("1");
        user.setTenantId("tenant1");
        user.setName("John Doe");
        user.setEmail("john@lincoln.com");
        user.setPassword("password123");
        user.setRole(Role.STUDENT);
    }

    @Test
    void createUser_Success() {
        when(userRepository.existsByEmailAndTenantId("john@lincoln.com", "tenant1"))
                .thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashedpassword");
        when(userRepository.save(user)).thenReturn(user);

        User result = userService.createUser(user);

        assertNotNull(result);
        assertEquals("hashedpassword", result.getPassword());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void createUser_DuplicateEmail_ThrowsException() {
        when(userRepository.existsByEmailAndTenantId("john@lincoln.com", "tenant1"))
                .thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> {
            userService.createUser(user);
        });

        verify(userRepository, never()).save(any());
    }

    @Test
    void createUser_PasswordIsHashed() {
        when(userRepository.existsByEmailAndTenantId(anyString(), anyString()))
                .thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("$2a$10$hashedvalue");
        when(userRepository.save(user)).thenReturn(user);

        User result = userService.createUser(user);

        assertNotEquals("password123", result.getPassword());
        assertEquals("$2a$10$hashedvalue", result.getPassword());
    }

    @Test
    void getUserById_Found() {
        when(userRepository.findById("1")).thenReturn(Optional.of(user));

        Optional<User> result = userService.getUserById("1");

        assertTrue(result.isPresent());
        assertEquals("john@lincoln.com", result.get().getEmail());
    }

    @Test
    void getUserById_NotFound() {
        when(userRepository.findById("999")).thenReturn(Optional.empty());

        Optional<User> result = userService.getUserById("999");

        assertFalse(result.isPresent());
    }
}