package com.nexuslms.engine.models;

// How much each kind of class-level work counts toward a student's overall score.
// Stored inside the school's own record. Assignments and quizzes don't count toward the
// class overall, so only these two are needed.
public record GradingWeights(int tests, int exams) {
    public static final GradingWeights DEFAULT = new GradingWeights(40, 60);
}