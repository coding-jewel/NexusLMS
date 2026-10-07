package com.nexuslms.engine.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

// A teacher or student who has filled in the join form and is waiting to enter the emailed code.
// The id is tenantId + ":" + email, so a person can only have one pending join per school at a time.
@Document("pending_joins")
public class PendingJoin {

    @Id
    private String id;

    private String tenantId;
    private String subdomain;

    private String name;
    private String email;
    private String passwordHash;

    private Role role;
    private String classId; // students only; null for teachers

    private String codeHash;
    private int attempts;
    private Instant lastSentAt;

    // MongoDB removes the document by itself shortly after this time (it checks about once a minute).
    @Indexed(expireAfter = "0s")
    private Instant expiresAt;

    public PendingJoin() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getSubdomain() { return subdomain; }
    public void setSubdomain(String subdomain) { this.subdomain = subdomain; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }

    public String getCodeHash() { return codeHash; }
    public void setCodeHash(String codeHash) { this.codeHash = codeHash; }

    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }

    public Instant getLastSentAt() { return lastSentAt; }
    public void setLastSentAt(Instant lastSentAt) { this.lastSentAt = lastSentAt; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
}