package com.nexuslms.engine.controller;

import com.nexuslms.engine.dto.ChangePasswordRequest;
import com.nexuslms.engine.dto.UserResponse;
import com.nexuslms.engine.security.AuthUser;
import com.nexuslms.engine.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<UserResponse> list(@RequestParam(required = false) String role,
                                   @RequestParam(required = false) String classId,
                                   @AuthenticationPrincipal AuthUser auth) {
        return userService.list(auth.tenantId(), role, classId).stream().map(UserResponse::from).toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public UserResponse get(@PathVariable String id, @AuthenticationPrincipal AuthUser auth) {
        return UserResponse.from(userService.get(auth.tenantId(), id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/approve")
    public UserResponse approve(@PathVariable String id, @AuthenticationPrincipal AuthUser auth) {
        return UserResponse.from(userService.approve(auth.tenantId(), id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/decline")
    public ResponseEntity<Void> decline(@PathVariable String id, @AuthenticationPrincipal AuthUser auth) {
        userService.decline(auth.tenantId(), id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, @AuthenticationPrincipal AuthUser auth) {
        userService.remove(auth.tenantId(), id);
        return ResponseEntity.noContent().build();
    }

    // --- Settings (any signed-in user) ---

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                               @AuthenticationPrincipal AuthUser auth) {
        userService.changePassword(auth.userId(), request);
        return ResponseEntity.ok().build();
    }
}