package com.nexuslms.engine.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

// Development only: prints the email in the backend console instead of sending it.
// Active unless app.mail.enabled=true.
@Service
@ConditionalOnProperty(name = "app.mail.enabled", havingValue = "false", matchIfMissing = true)
public class ConsoleEmailService implements EmailService {
    private static final Logger log = LoggerFactory.getLogger(ConsoleEmailService.class);

    @Override
    public void sendVerificationCode(String to, String schoolName, String code) {
        log.info("\n---------- EMAIL (development: not really sent) ----------\nTo: {}\nSubject: {}\n\n{}\n-----------------------------------------------------------",
                to, EmailService.verificationSubject(), EmailService.verificationBody(schoolName, code));
    }
}