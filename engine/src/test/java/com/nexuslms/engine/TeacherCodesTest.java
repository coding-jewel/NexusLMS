package com.nexuslms.engine;

import com.nexuslms.engine.service.TeacherCodes;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class TeacherCodesTest {

    @Test
    void aCodeStartsWithStaffAndHasSixCharactersAfterIt() {
        String code = TeacherCodes.generate();

        assertTrue(code.startsWith("STAFF-"));
        assertEquals(12, code.length());
        assertTrue(code.substring(6).matches("[A-HJ-NP-Z2-9]{6}"), "unexpected characters in " + code);
    }

    @Test
    void codesAreDifferentEachTime() {
        Set<String> codes = new HashSet<>();
        for (int i = 0; i < 200; i++) {
            codes.add(TeacherCodes.generate());
        }
        assertEquals(200, codes.size());
    }

    @Test
    void aTeacherCodeCanNeverLookLikeAClassCode() {
        // class codes are three characters, a dash and four more: JSS-4K7Q
        assertFalse(TeacherCodes.generate().matches("[A-Z]{3}-[A-Z2-9]{4}"));
    }

    @Test
    void typedCodesAreTrimmedAndUpperCased() {
        assertEquals("STAFF-7KQ2MX", TeacherCodes.normalize("  staff-7kq2mx "));
        assertEquals("", TeacherCodes.normalize(null));
    }
}