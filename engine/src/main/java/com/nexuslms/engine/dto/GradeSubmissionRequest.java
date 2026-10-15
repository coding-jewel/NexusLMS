package com.nexuslms.engine.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// The upper bound is checked by the service against the assignment's own totalMarks,
// so this DTO doesn't carry a fixed max — assignments aren't all out of 100.
public record GradeSubmissionRequest(
        @NotNull(message = "Grade is required.")
        @Min(value = 0, message = "Grade can't be below 0.")
        Integer grade,

        @Size(max = 2000, message = "Feedback is too long.")
        String feedback
) {}