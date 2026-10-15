package com.nexuslms.engine;

import com.nexuslms.engine.service.GradingRules;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GradingRulesTest {

    @Test
    void acceptsTheDefaults() {
        assertNull(GradingRules.problem(40, 60));
    }

    @Test
    void acceptsExactlyTheMinimums() {
        assertNull(GradingRules.problem(20, 80));
    }

    @Test
    void acceptsMinimumTestsWithMinimumExams() {
        assertNull(GradingRules.problem(50, 50));
    }

    @Test
    void rejectsTestsBelowTheMinimum() {
        String problem = GradingRules.problem(10, 90);
        assertNotNull(problem);
        assertTrue(problem.contains("Tests"));
    }

    @Test
    void rejectsExamsBelowTheMinimum() {
        String problem = GradingRules.problem(40, 40);
        assertNotNull(problem);
        assertTrue(problem.contains("Exams"));
    }

    @Test
    void rejectsATotalThatIsNotOneHundredAndSaysWhatItIs() {
        // Values chosen to pass the minimums (tests ≥ 20, exams ≥ 50) but not sum to 100.
        assertTrue(GradingRules.problem(20, 60).contains("80%"));
        assertTrue(GradingRules.problem(50, 60).contains("110%"));
    }
}