package com.nexuslms.engine.models;

// How much each kind of work counts toward a student's overall score.
// Stored inside the school's own record.
public record GradingWeights(int assignments, int tests, int exams) {
    public static final GradingWeights DEFAULT = new GradingWeights(20, 20, 60);
}