package com.nexuslms.engine.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class PendingApprovalException extends RuntimeException {
    public PendingApprovalException(String message) {
        super(message);
    }
}