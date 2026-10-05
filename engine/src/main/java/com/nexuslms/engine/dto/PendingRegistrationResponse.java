package com.nexuslms.engine.dto;

public record PendingRegistrationResponse(String email, int expiresInSeconds, int resendAfterSeconds) {}