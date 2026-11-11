package com.nexuslms.engine.dto;

import java.util.List;

public record ClassPeopleResponse(
        List<UserResponse> teachers,
        List<UserResponse> students
) {}