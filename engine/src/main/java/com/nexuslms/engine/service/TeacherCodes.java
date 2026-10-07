package com.nexuslms.engine.service;

import java.security.SecureRandom;

// The code teachers use to ask to join a school. It is longer than a class code and always starts
// with STAFF-, so the two can never be mistaken for each other ("JSS-4K7Q" is a class, "STAFF-..." is teachers).
public final class TeacherCodes {
    public static final String PREFIX = "STAFF-";
    public static final int LENGTH = 6;

    // no 0, O, 1 or I, so codes are easy to read out and type
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private TeacherCodes() {}

    /** "STAFF-" followed by six random characters, for example STAFF-7KQ2MX. */
    public static String generate() {
        StringBuilder suffix = new StringBuilder();
        for (int i = 0; i < LENGTH; i++) {
            suffix.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return PREFIX + suffix;
    }

    /** Codes are not case-sensitive when someone types one in. */
    public static String normalize(String raw) {
        return raw == null ? "" : raw.trim().toUpperCase();
    }
}