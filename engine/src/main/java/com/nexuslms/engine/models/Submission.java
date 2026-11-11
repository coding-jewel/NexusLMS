package com.nexuslms.engine.models;

import jakarta.validation.constraints.NotBlank;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document("submissions")
@CompoundIndex(name = "assignment_student_unique", def = "{'assignmentId': 1, 'studentId': 1}", unique = true)
public class Submission {
    @Id
    private String id;

    @NotBlank(message = "Tenant ID is required")
    @Indexed
    private String tenantId;

    @NotBlank(message = "Assignment ID is required")
    private String assignmentId;

    @NotBlank(message = "Student ID is required")
    @Indexed
    private String studentId;

    private String text;
    private List<String> fileUrls = new ArrayList<>();
    private Integer grade;
    private String feedback;
    private boolean graded = false;
    private boolean late = false;

    @CreatedDate
    private LocalDateTime submittedAt;

    public Submission() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getAssignmentId() { return assignmentId; }
    public void setAssignmentId(String assignmentId) { this.assignmentId = assignmentId; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public List<String> getFileUrls() { return fileUrls; }
    public void setFileUrls(List<String> fileUrls) { this.fileUrls = fileUrls == null ? new ArrayList<>() : fileUrls; }

    public Integer getGrade() { return grade; }
    public void setGrade(Integer grade) { this.grade = grade; }

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }

    public boolean isGraded() { return graded; }
    public void setGraded(boolean graded) { this.graded = graded; }

    public boolean isLate() { return late; }
    public void setLate(boolean late) { this.late = late; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
}