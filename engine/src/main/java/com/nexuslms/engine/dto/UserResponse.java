package com.nexuslms.engine.dto;

import com.nexuslms.engine.models.Role;
import com.nexuslms.engine.models.User;

import java.time.LocalDateTime;
import java.util.List;

public record UserResponse(
        String id,
        String tenantId,
        String name,
        String email,
        Role role,
        List<String> classIds,
        boolean active,
        boolean approved,
        LocalDateTime createdAt
) {
    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getTenantId(), u.getName(), u.getEmail(),
                u.getRole(), u.getClassIds(), u.isActive(), u.isApproved(), u.getCreatedAt());
    }
}