package com.nexuslms.engine.models;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;


@Document("tenants")
public class Tenant {

    @Id
    private String id;

    @NotBlank(message = "School name is required")
    private String name;

    @NotBlank(message = "Subdomain is required")
    @Indexed(unique = true)
    private String subdomain;

    private GradingWeights gradingWeights;

    // The code teachers use to ask to join this school. Unique across all schools.
    @Indexed(unique = true, sparse = true)
    private String teacherCode;

    private boolean active = true;

    @CreatedDate
    private LocalDateTime createdAt;

    //Constructor
    public Tenant() {}

    //Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSubdomain() {
        return subdomain;
    }

    public void setSubdomain(String subdomain) {
        this.subdomain = subdomain;
    }

    @JsonIgnore
    public GradingWeights getGradingWeights() {
        return gradingWeights;
    }

    public void setGradingWeights(GradingWeights gradingWeights) {
        this.gradingWeights = gradingWeights;
    }

    // Anyone signed in to the school can read the school record, so keep the code out of it.
    @JsonIgnore
    public String getTeacherCode() {
        return teacherCode;
    }

    public void setTeacherCode(String teacherCode) {
        this.teacherCode = teacherCode;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
