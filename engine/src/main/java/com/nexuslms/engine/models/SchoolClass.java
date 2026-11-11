package com.nexuslms.engine.models;

import jakarta.validation.constraints.NotBlank;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document("classes")
@CompoundIndex(name = "tenant_name_unique", def = "{'tenantId': 1, 'name': 1}", unique = true)
public class SchoolClass {
    @Id
    private String id;

    @NotBlank(message = "Tenant ID is required")
    private String tenantId;

    @NotBlank(message = "Class name is required")
    private String name;

    private String description;

    @Indexed(unique = true, sparse = true)
    private String code;

    private String gradingMethod = "RAW";
    private int assignmentWeight = 30;
    private int quizWeight = 30;
    private int examWeight = 40;

    @CreatedDate
    private LocalDateTime createdAt;

    public SchoolClass() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getGradingMethod() { return gradingMethod; }
    public void setGradingMethod(String gradingMethod) { this.gradingMethod = gradingMethod; }

    public int getAssignmentWeight() { return assignmentWeight; }
    public void setAssignmentWeight(int assignmentWeight) { this.assignmentWeight = assignmentWeight; }

    public int getQuizWeight() { return quizWeight; }
    public void setQuizWeight(int quizWeight) { this.quizWeight = quizWeight; }

    public int getExamWeight() { return examWeight; }
    public void setExamWeight(int examWeight) { this.examWeight = examWeight; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}