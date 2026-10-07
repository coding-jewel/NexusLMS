package com.nexuslms.engine;

import com.nexuslms.engine.service.GradingRules;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GradingRulesTest {

    @Test
    void acceptsTheDefaults() {
        assertNull(GradingRules.problem(20, 20, 60));
    }

    @Test
    void assignmentsMayCountForNothing() {
        assertNull(GradingRules.problem(0, 40, 60));
    }

    @Test
    void acceptsExactlyTheMinimums() {
        assertNull(GradingRules.problem(30, 20, 50));
    }

    @Test
    void rejectsTestsBelowTheMinimum() {
        String problem = GradingRules.problem(40, 10, 50);

        assertNotNull(problem);
        assertTrue(problem.contains("Tests"));
    }

    @Test
    void rejectsExamsBelowTheMinimum() {
        String problem = GradingRules.problem(30, 30, 40);

        assertNotNull(problem);
        assertTrue(problem.contains("Exams"));
    }

    @Test
    void rejectsNegativeAssignments() {
        String problem = GradingRules.problem(-10, 60, 50);

        assertNotNull(problem);
        assertTrue(problem.contains("Assignments"));
    }

    @Test
    void rejectsATotalThatIsNotOneHundredAndSaysWhatItIs() {
        assertTrue(GradingRules.problem(20, 20, 50).contains("90%"));
        assertTrue(GradingRules.problem(30, 30, 60).contains("120%"));
    }
}