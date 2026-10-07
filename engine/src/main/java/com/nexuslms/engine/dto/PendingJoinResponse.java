package com.nexuslms.engine.dto;

import com.nexuslms.engine.models.Role;

public record PendingJoinResponse(String email, Role role, int expiresInSeconds, int resendAfterSeconds) {}