package com.nexuslms.engine.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

// A school registration waiting for its emailed code. Nothing here is a real school or user yet.
// The subdomain is the id, so only one registration can hold an address at a time.
@Document("pending_registrations")
public class PendingRegistration {

    @Id
    private String subdomain;

    private String schoolName;
    private String email;
    private String passwordHash;
    private String codeHash;
    private int attempts;
    private Instant lastSentAt;

    // MongoDB removes the document by itself shortly after this time (it checks about once a minute).
    @Indexed(expireAfter = "0s")
    private Instant expiresAt;

    public PendingRegistration() {}

    public String getSubdomain() { return subdomain; }
    public void setSubdomain(String subdomain) { this.subdomain = subdomain; }

    public String getSchoolName() { return schoolName; }
    public void setSchoolName(String schoolName) { this.schoolName = schoolName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getCodeHash() { return codeHash; }
    public void setCodeHash(String codeHash) { this.codeHash = codeHash; }

    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }

    public Instant getLastSentAt() { return lastSentAt; }
    public void setLastSentAt(Instant lastSentAt) { this.lastSentAt = lastSentAt; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
}