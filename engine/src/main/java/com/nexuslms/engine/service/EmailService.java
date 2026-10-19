package com.nexuslms.engine.service;

public interface EmailService {

    void sendVerificationCode(String to, String schoolName, String code);

    void sendPasswordResetLink(String to, String schoolName, String resetUrl);

    static String verificationSubject() {
        return "Your NexusLMS verification code";
    }

    static String verificationBody(String schoolName, String code) {
        return "Your verification code is " + code + "\n\n"
                + "Use it to finish signing up to " + schoolName + " on NexusLMS. It expires in 15 minutes.\n\n"
                + "If you didn't try to sign up, you can ignore this email.";
    }

    static String resetSubject() {
        return "Reset your NexusLMS password";
    }

    static String resetBody(String schoolName, String resetUrl) {
        return "We received a request to reset your password for " + schoolName + " on NexusLMS.\n\n"
                + "Click the link below to set a new password. It expires in 15 minutes.\n\n"
                + resetUrl + "\n\n"
                + "If you didn't ask for this, you can safely ignore this email.";
    }
}