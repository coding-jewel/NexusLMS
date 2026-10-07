package com.nexuslms.engine.dto;

// token is null when the account is waiting for the school admin to approve it (teacher path).
public record JoinResponse(String subdomain, UserResponse user, String token) {}