package com.nexuslms.engine.controller;

import com.nexuslms.engine.dto.JoinRequest;
import com.nexuslms.engine.dto.JoinResponse;
import com.nexuslms.engine.dto.PendingJoinResponse;
import com.nexuslms.engine.dto.ResendJoinRequest;
import com.nexuslms.engine.dto.VerifyJoinRequest;
import com.nexuslms.engine.service.JoinService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Public: whoever redeems a code has no session yet. Lives under /api/public so SecurityConfig
// already permits it without a token.
@RestController
@RequestMapping("/api/public/join")
public class JoinController {

    private final JoinService joinService;

    public JoinController(JoinService joinService) {
        this.joinService = joinService;
    }

    // Step 1: hold the details, email a code. Nothing real is created yet.
    @PostMapping
    public ResponseEntity<PendingJoinResponse> start(@Valid @RequestBody JoinRequest request) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(joinService.start(request));
    }

    // Step 2: a right code creates the account. Students are signed in; teachers wait for approval.
    @PostMapping("/verify")
    public ResponseEntity<JoinResponse> verify(@Valid @RequestBody VerifyJoinRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(joinService.verify(request));
    }

    @PostMapping("/resend")
    public ResponseEntity<PendingJoinResponse> resend(@Valid @RequestBody ResendJoinRequest request) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(joinService.resend(request));
    }
}