package com.nexuslms.engine.dto;

import com.nexuslms.engine.models.SchoolClass;

import java.time.LocalDateTime;

public record ClassResponse(String id, String name, String description, String code, LocalDateTime createdAt) {
    public static ClassResponse from(SchoolClass c) {
        return new ClassResponse(c.getId(), c.getName(), c.getDescription(), c.getCode(), c.getCreatedAt());
    }
}