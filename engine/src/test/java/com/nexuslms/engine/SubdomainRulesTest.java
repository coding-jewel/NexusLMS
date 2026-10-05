package com.nexuslms.engine;

import com.nexuslms.engine.service.SubdomainRules;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SubdomainRulesTest {

    @Test
    void normalizeTrimsAndLowercases() {
        assertEquals("lincoln", SubdomainRules.normalize("  Lincoln "));
        assertEquals("", SubdomainRules.normalize(null));
    }

    @Test
    void acceptsNormalAddresses() {
        assertNull(SubdomainRules.problem("lincoln"));
        assertNull(SubdomainRules.problem("st-marys"));
        assertNull(SubdomainRules.problem("nexus-international-college"));
        assertNull(SubdomainRules.problem("school2"));
    }

    @Test
    void rejectsReservedNames() {
        assertNotNull(SubdomainRules.problem("admin"));
        assertNotNull(SubdomainRules.problem("www"));
    }

    @Test
    void rejectsBadShapes() {
        assertNotNull(SubdomainRules.problem("ab"));
        assertNotNull(SubdomainRules.problem("my_school"));
        assertNotNull(SubdomainRules.problem("-lincoln"));
        assertNotNull(SubdomainRules.problem("lincoln-"));
        assertNotNull(SubdomainRules.problem("a".repeat(31)));
        assertNotNull(SubdomainRules.problem(""));
    }
}