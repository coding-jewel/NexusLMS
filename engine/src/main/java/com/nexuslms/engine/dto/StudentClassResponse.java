package com.nexuslms.engine.dto;

import java.util.List;

// A class the student is enrolled in, with its published topics (which may be empty).
public record StudentClassResponse(
        String id,
        String name,
        List<StudentTopicResponse> topics
) {}