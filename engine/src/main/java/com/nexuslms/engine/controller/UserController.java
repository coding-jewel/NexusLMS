package com.nexuslms.engine.controller;

import com.nexuslms.engine.dto.UserResponse;
import com.nexuslms.engine.security.AuthUser;
import com.nexuslms.engine.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// The admin's view of their own school's people. The school always comes from the signed-in user.
// There is no "create user" endpoint: admins register with their school, teachers and students
// join with a code, and each of those flows creates the user on the server.
@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // Optional filters: ?role=TEACHER or ?role=STUDENT, and ?classId=...
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

    // A teacher who joined with the school's code is approved here, and can then sign in.
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/approve")
    public UserResponse approve(@PathVariable String id, @AuthenticationPrincipal AuthUser auth) {
        return UserResponse.from(userService.approve(auth.tenantId(), id));
    }

    // Declining removes the request. The person can apply again.
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
}