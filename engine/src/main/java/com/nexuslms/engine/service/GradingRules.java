package com.nexuslms.engine.service;

public final class GradingRules {
    public static final int MIN_TESTS = 20;
    public static final int MIN_EXAMS = 50;

    private GradingRules() {}

    /** Returns a message the admin can read, or null when the weights are acceptable. */
    public static String problem(int assignments, int tests, int exams) {
        if (assignments < 0) {
            return "Assignments can't count for less than 0%.";
        }
        if (tests < MIN_TESTS) {
            return "Tests must count for at least " + MIN_TESTS + "%.";
        }
        if (exams < MIN_EXAMS) {
            return "Exams must count for at least " + MIN_EXAMS + "%.";
        }
        int total = assignments + tests + exams;
        if (total != 100) {
            return "The weights must add up to 100%. Right now they add up to " + total + "%.";
        }
        return null;
    }
}