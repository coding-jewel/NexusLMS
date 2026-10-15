package com.nexuslms.engine.models;

// A quiz lives at the topic level (QUIZ) or at the class level (TEST / EXAM).
// QUIZ has a courseId and no classId. TEST and EXAM have a classId and no courseId.
public enum QuizCategory {
    QUIZ,
    TEST,
    EXAM
}