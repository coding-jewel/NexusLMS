package com.nexuslms.engine.models;

import jakarta.validation.constraints.NotBlank;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document("quizzes")
public class Quiz {
    @Id
    private String id;

    @NotBlank(message = "Tenant ID is required")
    private String tenantId;

    private QuizCategory category;

    private String courseId;

    private String classId;

    @NotBlank(message = "Teacher ID is required")
    private String teacherId;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private Integer timeLimitMinutes;

    private List<Question> questions = new ArrayList<>();

    private List<String> attachmentUrls = new ArrayList<>();

    private boolean published = false;

    private boolean resultsReleased = false;

    // Anti-cheat guard when a student is taking this quiz.
    // OFF — don't record anything. RECORD — count tab-aways and show them to the teacher.
    // AUTO — same as RECORD, plus the client auto-submits once the limit is reached.
    private String guardMode = "RECORD";
    private int guardLimit = 3;

    @CreatedDate
    private LocalDateTime createdAt;

    //Constructor
    public Quiz() {}

    //Getters and Setters

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public QuizCategory getCategory() { return category; }
    public void setCategory(QuizCategory category) { this.category = category; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }

    public String getTeacherId() { return teacherId; }
    public void setTeacherId(String teacherId) { this.teacherId = teacherId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getTimeLimitMinutes() { return timeLimitMinutes; }
    public void setTimeLimitMinutes(Integer timeLimitMinutes) { this.timeLimitMinutes = timeLimitMinutes; }

    public List<Question> getQuestions() { return questions; }
    public void setQuestions(List<Question> questions) { this.questions = questions == null ? new ArrayList<>() : questions; }

    public List<String> getAttachmentUrls() { return attachmentUrls; }
    public void setAttachmentUrls(List<String> attachmentUrls) {
        this.attachmentUrls = attachmentUrls == null ? new ArrayList<>() : attachmentUrls;
    }

    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }

    public boolean isResultsReleased() { return resultsReleased; }
    public void setResultsReleased(boolean resultsReleased) { this.resultsReleased = resultsReleased; }

    public String getGuardMode() { return guardMode; }
    public void setGuardMode(String guardMode) { this.guardMode = guardMode; }

    public int getGuardLimit() { return guardLimit <= 0 ? 3 : guardLimit; }
    public void setGuardLimit(int guardLimit) { this.guardLimit = guardLimit; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}