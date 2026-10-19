package com.nexuslms.engine.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document("password_reset_tokens")
public class PasswordResetToken {
    @Id
    private String token;
    private String userId;

    @Indexed(expireAfter = "0s")
    private Instant expiresAt;

    public PasswordResetToken() {}
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
}