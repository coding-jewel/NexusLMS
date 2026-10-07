package com.nexuslms.engine.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// What a teacher sends to create a course. The school and the teacher are not here on purpose:
// the server takes both from the signed-in user.
public record CourseRequest(
        @NotBlank(message = "Choose a class for this course")
        String classId,

        @NotBlank(message = "Course title is required")
        @Size(max = 100, message = "Course title is too long")
        String title,

        @Size(max = 500, message = "Description is too long")
        String description
) {}