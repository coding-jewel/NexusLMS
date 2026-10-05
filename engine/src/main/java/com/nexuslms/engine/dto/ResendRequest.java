package com.nexuslms.engine.dto;

import jakarta.validation.constraints.NotBlank;

public record ResendRequest(@NotBlank(message = "School address is required") String subdomain) {}