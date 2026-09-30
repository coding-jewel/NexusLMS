package com.nexuslms.engine.controller;

import com.nexuslms.engine.models.User;
import com.nexuslms.engine.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<User> createUser(@Valid @RequestBody User user) {
        User created = userService.createUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<User>> getAllUsersByTenant(@PathVariable String tenantId) {
        return ResponseEntity.ok(userService.getAllUsersByTenant(tenantId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tenant/{tenantId}/role/{role}")
    public ResponseEntity<List<User>> getUsersByRole(
            @PathVariable String tenantId,
            @PathVariable String role
    ) {
        return ResponseEntity.ok(userService.getUsersByRole(tenantId, role));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

}
