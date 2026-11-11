package com.nexuslms.engine.service;

import org.springframework.context.annotation.Primary;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Primary // This tells Spring to use this instead of the ConsoleEmailService
public class SmtpEmailService implements EmailService {

    private final JavaMailSender mailSender;

    public SmtpEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendVerificationCode(String to, String schoolName, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(EmailService.verificationSubject());
        message.setText(EmailService.verificationBody(schoolName, code));

        mailSender.send(message);
        System.out.println("✅ Real verification email sent to " + to);
    }

    @Override
    public void sendPasswordResetLink(String to, String schoolName, String resetUrl) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(EmailService.resetSubject());
        message.setText(EmailService.resetBody(schoolName, resetUrl));

        mailSender.send(message);
        System.out.println("✅ Real password reset email sent to " + to);
    }
}