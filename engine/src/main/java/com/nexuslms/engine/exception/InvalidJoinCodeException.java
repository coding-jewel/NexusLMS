package com.nexuslms.engine.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidJoinCodeException extends RuntimeException {
    public InvalidJoinCodeException(String message) {
        super(message);
    }
}