package com.nexuslms.engine.dto;

import java.util.List;

// Who's on the course: the teacher and the students of the class it lives in.
public record CoursePeopleResponse(UserResponse teacher, List<UserResponse> students) {}