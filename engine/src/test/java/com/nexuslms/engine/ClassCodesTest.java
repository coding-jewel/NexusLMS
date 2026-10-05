package com.nexuslms.engine;

import com.nexuslms.engine.service.ClassCodes;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ClassCodesTest {

    private static final String FORMAT = "^[A-Z]{3}-[A-HJ-NP-Z2-9]{4}$";

    @Test
    void usesThreeLettersFromTheNameThenFourRandomCharacters() {
        String code = ClassCodes.generate("Coding Club");

        assertTrue(code.matches(FORMAT));
        assertTrue(code.startsWith("COD-"));
    }

    @Test
    void skipsNumbersAndSpacesInTheName() {
        assertTrue(ClassCodes.generate("JSS 1 Gold").startsWith("JSS-"));
        assertTrue(ClassCodes.generate("1 A B C").startsWith("ABC-"));
    }

    @Test
    void padsShortOrLetterlessNames() {
        assertTrue(ClassCodes.generate("SS").startsWith("SSX-"));
        assertTrue(ClassCodes.generate("123").startsWith("XXX-"));
        assertTrue(ClassCodes.generate("123").matches(FORMAT));
    }

    @Test
    void normalizeIgnoresCaseAndSpaces() {
        assertEquals("JSS-4K7Q", ClassCodes.normalize("  jss-4k7q "));
        assertEquals("", ClassCodes.normalize(null));
    }
}