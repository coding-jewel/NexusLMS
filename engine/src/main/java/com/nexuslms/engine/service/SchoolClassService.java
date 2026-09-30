package com.nexuslms.engine.service;

import com.nexuslms.engine.exception.DuplicateResourceException;
import com.nexuslms.engine.models.SchoolClass;
import com.nexuslms.engine.repository.SchoolClassRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SchoolClassService {

    private final SchoolClassRepository schoolClassRepository;

    public SchoolClassService(SchoolClassRepository schoolClassRepository) {
        this.schoolClassRepository = schoolClassRepository;
    }

    public SchoolClass createClass(SchoolClass schoolClass) {
        if (schoolClassRepository.existsByNameAndTenantId(
                schoolClass.getName(), schoolClass.getTenantId())) {
            throw new DuplicateResourceException("A class with this name already exists");
        }
        return schoolClassRepository.save(schoolClass);
    }

    public List<SchoolClass> getAllClassesByTenant(String tenantId) {
        return schoolClassRepository.findAllByTenantId(tenantId);
    }

    public Optional<SchoolClass> getClassById(String id) {
        return schoolClassRepository.findById(id);
    }

    public void deleteClass(String id) {
        schoolClassRepository.deleteById(id);
    }
}