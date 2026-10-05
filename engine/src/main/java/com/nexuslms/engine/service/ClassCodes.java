package com.nexuslms.engine.service;

import java.security.SecureRandom;

public final class ClassCodes {
    // no 0, O, 1 or I, so codes are easy to read out and type
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private ClassCodes() {}

    /** "JSS 1 Gold" -> "JSS-4K7Q": three letters from the name, then four random characters. */
    public static String generate(String className) {
        StringBuilder prefix = new StringBuilder();
        for (char c : className.toUpperCase().toCharArray()) {
            if (c >= 'A' && c <= 'Z') {
                prefix.append(c);
            }
            if (prefix.length() == 3) {
                break;
            }
        }
        while (prefix.length() < 3) {
            prefix.append('X');
        }

        StringBuilder suffix = new StringBuilder();
        for (int i = 0; i < 4; i++) {
            suffix.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return prefix + "-" + suffix;
    }

    /** Codes are not case-sensitive when someone types one in. */
    public static String normalize(String raw) {
        return raw == null ? "" : raw.trim().toUpperCase();
    }
}