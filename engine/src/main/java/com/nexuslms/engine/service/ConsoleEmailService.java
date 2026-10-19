package com.nexuslms.engine.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class ConsoleEmailService implements EmailService {
    private static final Logger log = LoggerFactory.getLogger(ConsoleEmailService.class);

    @Override
    public void sendVerificationCode(String to, String schoolName, String code) {
        log.info("\n---------- EMAIL (development: not really sent) ----------\nTo: {}\nSubject: {}\n\n{}\n-----------------------------------------------------------",
                to, EmailService.verificationSubject(), EmailService.verificationBody(schoolName, code));
    }

    @Override
    public void sendPasswordResetLink(String to, String schoolName, String resetUrl) {
        log.info("\n---------- EMAIL (development: not really sent) ----------\nTo: {}\nSubject: {}\n\n{}\n-----------------------------------------------------------",
                to, EmailService.resetSubject(), EmailService.resetBody(schoolName, resetUrl));
    }
}