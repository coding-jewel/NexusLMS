package com.nexuslms.engine.dto;

import com.nexuslms.engine.models.Role;
import com.nexuslms.engine.models.User;

import java.time.LocalDateTime;

public record UserResponse(
        String id,
        String tenantId,
        String name,
        String email,
        Role role,
        String classId,
        boolean active,
        LocalDateTime createdAt
) {
    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getTenantId(), u.getName(), u.getEmail(),
                u.getRole(), u.getClassId(), u.isActive(), u.getCreatedAt());
    }
}