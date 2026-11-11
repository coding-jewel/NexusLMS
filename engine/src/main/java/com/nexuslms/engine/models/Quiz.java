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

@Document("quizzes")
@CompoundIndex(name = "class_category_idx", def = "{'classId': 1, 'category': 1}")
public class Quiz {
    @Id
    private String id;

    @NotBlank(message = "Tenant ID is required")
    @Indexed
    private String tenantId;

    private QuizCategory category;

    @Indexed
    private String courseId;

    private String classId;

    @NotBlank(message = "Teacher ID is required")
    @Indexed
    private String teacherId;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    private Integer timeLimitMinutes;
    private int totalMarks = 0;
    private List<Question> questions = new ArrayList<>();
    private List<String> attachmentUrls = new ArrayList<>();
    private boolean published = false;
    private boolean resultsReleased = false;

    @CreatedDate
    private LocalDateTime createdAt;

    public Quiz() {}

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

    public int getTotalMarks() { return totalMarks; }
    public void setTotalMarks(int totalMarks) { this.totalMarks = Math.max(0, totalMarks); }

    public int effectiveTotalMarks() {
        if (totalMarks > 0) return totalMarks;
        return questions.stream().mapToInt(q -> q.getMarks() != null ? q.getMarks() : 1).sum();
    }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}