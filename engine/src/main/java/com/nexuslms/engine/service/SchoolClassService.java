package com.nexuslms.engine.service;

import com.nexuslms.engine.dto.ClassRequest;
import com.nexuslms.engine.exception.DuplicateResourceException;
import com.nexuslms.engine.exception.InvalidRequestException;
import com.nexuslms.engine.exception.NotFoundException;
import com.nexuslms.engine.models.SchoolClass;
import com.nexuslms.engine.repository.SchoolClassRepository;
import com.nexuslms.engine.repository.UserRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

// Every method takes the school from the signed-in user, never from the request.
@Service
public class SchoolClassService {

    private final SchoolClassRepository classRepository;
    private final UserRepository userRepository;

    public SchoolClassService(SchoolClassRepository classRepository, UserRepository userRepository) {
        this.classRepository = classRepository;
        this.userRepository = userRepository;
    }

    public SchoolClass create(String tenantId, ClassRequest request) {
        String name = request.name().trim();
        if (classRepository.existsByNameAndTenantId(name, tenantId)) {
            throw new DuplicateResourceException("A class with this name already exists");
        }
        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setTenantId(tenantId);
        schoolClass.setName(name);
        schoolClass.setDescription(request.description() == null ? null : request.description().trim());
        return saveWithNewCode(schoolClass);
    }

    public List<SchoolClass> list(String tenantId) {
        return classRepository.findAllByTenantId(tenantId).stream()
                .sorted(Comparator.comparing(SchoolClass::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public SchoolClass regenerateCode(String tenantId, String id) {
        return saveWithNewCode(owned(tenantId, id));
    }

    public void delete(String tenantId, String id) {
        SchoolClass schoolClass = owned(tenantId, id);
        if (userRepository.existsByClassId(schoolClass.getId())) {
            throw new InvalidRequestException("This class still has students. Remove them first.");
        }
        // TODO(courses step): also refuse when the class still has courses
        classRepository.deleteById(schoolClass.getId());
    }

    // A class from another school looks exactly like a class that doesn't exist.
    private SchoolClass owned(String tenantId, String id) {
        return classRepository.findById(id)
                .filter(c -> tenantId.equals(c.getTenantId()))
                .orElseThrow(() -> new NotFoundException("Class not found"));
    }

    private SchoolClass saveWithNewCode(SchoolClass schoolClass) {
        for (int attempt = 0; attempt < 10; attempt++) {
            String code = ClassCodes.generate(schoolClass.getName());
            if (classRepository.existsByCode(code)) {
                continue;
            }
            schoolClass.setCode(code);
            try {
                return classRepository.save(schoolClass);
            } catch (DuplicateKeyException e) {
                // someone else got that code at the same moment; try another
            }
        }
        throw new IllegalStateException("Could not create a unique class code");
    }
}