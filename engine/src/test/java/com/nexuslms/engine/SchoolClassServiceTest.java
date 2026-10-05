package com.nexuslms.engine;

import com.nexuslms.engine.dto.ClassRequest;
import com.nexuslms.engine.exception.DuplicateResourceException;
import com.nexuslms.engine.exception.InvalidRequestException;
import com.nexuslms.engine.exception.NotFoundException;
import com.nexuslms.engine.models.SchoolClass;
import com.nexuslms.engine.repository.SchoolClassRepository;
import com.nexuslms.engine.repository.UserRepository;
import com.nexuslms.engine.service.SchoolClassService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SchoolClassServiceTest {

    private static final String CODE_FORMAT = "^[A-Z]{3}-[A-HJ-NP-Z2-9]{4}$";

    @Mock SchoolClassRepository classRepository;
    @Mock UserRepository userRepository;
    @InjectMocks SchoolClassService service;

    @BeforeEach
    void setUp() {
        when(classRepository.save(any())).thenAnswer(i -> {
            SchoolClass c = i.getArgument(0);
            if (c.getId() == null) {
                c.setId("c1");
            }
            return c;
        });
    }

    private SchoolClass existing(String tenantId, String name) {
        SchoolClass c = new SchoolClass();
        c.setId("c1");
        c.setTenantId(tenantId);
        c.setName(name);
        c.setCode("OLD-AAAA");
        return c;
    }

    @Test
    void createsAClassInTheCallersSchoolWithACode() {
        SchoolClass created = service.create("t1", new ClassRequest("  JSS 1 Gold ", " First year "));

        assertEquals("t1", created.getTenantId());
        assertEquals("JSS 1 Gold", created.getName());
        assertEquals("First year", created.getDescription());
        assertTrue(created.getCode().matches(CODE_FORMAT));
    }

    @Test
    void rejectsADuplicateNameInTheSameSchool() {
        when(classRepository.existsByNameAndTenantId("JSS 1 Gold", "t1")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> service.create("t1", new ClassRequest("JSS 1 Gold", null)));
        verify(classRepository, never()).save(any());
    }

    @Test
    void triesAnotherCodeWhenOneIsAlreadyUsed() {
        when(classRepository.existsByCode(anyString())).thenReturn(true, false);

        SchoolClass created = service.create("t1", new ClassRequest("JSS 1 Gold", null));

        assertTrue(created.getCode().matches(CODE_FORMAT));
        verify(classRepository, times(2)).existsByCode(anyString());
        verify(classRepository, times(1)).save(any());
    }

    @Test
    void listsClassesByNameWithoutCaringAboutCase() {
        when(classRepository.findAllByTenantId("t1")).thenReturn(List.of(
                existing("t1", "ss 2 Arts"), existing("t1", "JSS 1 Gold"), existing("t1", "Coding Club")));

        List<String> names = service.list("t1").stream().map(SchoolClass::getName).toList();

        assertEquals(List.of("Coding Club", "JSS 1 Gold", "ss 2 Arts"), names);
    }

    @Test
    void regeneratingGivesTheClassAFreshCode() {
        when(classRepository.findById("c1")).thenReturn(Optional.of(existing("t1", "JSS 1 Gold")));

        SchoolClass updated = service.regenerateCode("t1", "c1");

        assertTrue(updated.getCode().matches(CODE_FORMAT));
        verify(classRepository).save(updated);
    }

    @Test
    void regeneratingAnotherSchoolsClassLooksLikeItDoesNotExist() {
        when(classRepository.findById("c1")).thenReturn(Optional.of(existing("t2", "JSS 1 Gold")));

        assertThrows(NotFoundException.class, () -> service.regenerateCode("t1", "c1"));
        verify(classRepository, never()).save(any());
    }

    @Test
    void deletesAnEmptyClass() {
        when(classRepository.findById("c1")).thenReturn(Optional.of(existing("t1", "JSS 1 Gold")));

        service.delete("t1", "c1");

        verify(classRepository).deleteById("c1");
    }

    @Test
    void refusesToDeleteAClassThatStillHasStudents() {
        when(classRepository.findById("c1")).thenReturn(Optional.of(existing("t1", "JSS 1 Gold")));
        when(userRepository.existsByClassId("c1")).thenReturn(true);

        assertThrows(InvalidRequestException.class, () -> service.delete("t1", "c1"));
        verify(classRepository, never()).deleteById(anyString());
    }

    @Test
    void refusesToDeleteAnotherSchoolsClass() {
        when(classRepository.findById("c1")).thenReturn(Optional.of(existing("t2", "JSS 1 Gold")));

        assertThrows(NotFoundException.class, () -> service.delete("t1", "c1"));
        verify(classRepository, never()).deleteById(anyString());
    }
}