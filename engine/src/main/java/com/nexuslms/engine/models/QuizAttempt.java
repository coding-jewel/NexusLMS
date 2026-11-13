package com.nexuslms.engine.models;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Document("quiz_attempts")
@CompoundIndexes({
        @CompoundIndex(name = "expiry_lookup_idx", def = "{ 'submitted': 1, 'expiresAt': 1 }"),
        @CompoundIndex(name = "quiz_student_unique", def = "{'quizId': 1, 'studentId': 1}", unique = true)
})
public class QuizAttempt {
    @Id
    private String id;

    @NotBlank(message = "Tenant ID is required")
    @Indexed
    private String tenantId;

    @NotBlank(message = "Quiz ID is required")
    private String quizId;

    @NotBlank(message = "Student ID is required")
    @Indexed
    private String studentId;

    @NotNull(message = "Answers are required")
    private Map<String, String> answers;

    private Integer score;
    private boolean graded = false;
    
    // FIXED: Changed to Instant to prevent timezone bugs
    private Instant startedAt;
    private Instant expiresAt;
    private boolean submitted = false;
    private Instant submittedAt;

    @CreatedDate
    private Instant attemptedAt;

    public QuizAttempt() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getQuizId() { return quizId; }
    public void setQuizId(String quizId) { this.quizId = quizId; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public Map<String, String> getAnswers() { return answers; }
    public void setAnswers(Map<String, String> answers) { this.answers = answers; }

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public boolean isGraded() { return graded; }
    public void setGraded(boolean graded) { this.graded = graded; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public boolean isSubmitted() { return submitted; }
    public void setSubmitted(boolean submitted) { this.submitted = submitted; }

    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }

    public Instant getAttemptedAt() { return attemptedAt; }
    public void setAttemptedAt(Instant attemptedAt) { this.attemptedAt = attemptedAt; }
}