package com.nexuslms.engine.models;

// A quiz lives at the topic level (QUIZ) or at the class level (EXAM).
// QUIZ has a courseId and no classId. EXAM has a classId and no courseId.
public enum QuizCategory {
    QUIZ,
    EXAM
}