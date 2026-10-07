package com.nexuslms.engine.service;

public interface EmailService {

    void sendVerificationCode(String to, String schoolName, String code);

    static String verificationSubject() {
        return "Your NexusLMS verification code";
    }

    static String verificationBody(String schoolName, String code) {
        return "Your verification code is " + code + "\n\n"
                + "Use it to finish signing up to " + schoolName + " on NexusLMS. It expires in 15 minutes.\n\n"
                + "If you didn't try to sign up, you can ignore this email.";
    }
}