package com.nexuslms.engine.models;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document("grades")
@CompoundIndexes({
        @CompoundIndex(name = "quiz_student_unique_idx", def = "{'quizId': 1, 'studentId': 1}", unique = true, partialFilter = "{'quizId': {$exists: true}}"),
        @CompoundIndex(name = "assignment_student_unique_idx", def = "{'assignmentId': 1, 'studentId': 1}", unique = true, partialFilter = "{'assignmentId': {$exists: true}}"),
        @CompoundIndex(name = "student_course_idx", def = "{'studentId': 1, 'courseId': 1}"),
        @CompoundIndex(name = "class_grade_idx", def = "{'classId': 1}"),
        @CompoundIndex(name = "assignment_grade_idx", def = "{'assignmentId': 1}"),
        @CompoundIndex(name = "quiz_grade_idx", def = "{'quizId': 1}")
})
public class Grade {
    @Id
    private String id;

    @NotBlank(message = "Tenant ID is required")
    @Indexed
    private String tenantId;

    @NotBlank(message = "Student ID is required")
    private String studentId;

    @Indexed
    private String courseId;

    private String classId;
    private String assignmentId;
    private String quizId;

    @NotNull(message = "Score is required")
    private Integer score;

    private Integer totalMarks;
    private String feedback;

    @NotNull(message = "Grade type is required")
    private GradeType type;

    @CreatedDate
    private LocalDateTime gradedAt;

    public Grade() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }

    public String getAssignmentId() { return assignmentId; }
    public void setAssignmentId(String assignmentId) { this.assignmentId = assignmentId; }

    public String getQuizId() { return quizId; }
    public void setQuizId(String quizId) { this.quizId = quizId; }

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public Integer getTotalMarks() { return totalMarks; }
    public void setTotalMarks(Integer totalMarks) { this.totalMarks = totalMarks; }

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }

    public GradeType getType() { return type; }
    public void setType(GradeType type) { this.type = type; }

    public LocalDateTime getGradedAt() { return gradedAt; }
    public void setGradedAt(LocalDateTime gradedAt) { this.gradedAt = gradedAt; }
}