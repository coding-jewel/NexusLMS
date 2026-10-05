package com.nexuslms.engine.repository;

import com.nexuslms.engine.models.SchoolClass;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SchoolClassRepository extends MongoRepository<SchoolClass, String> {
    @Query("{ 'tenantId': ?0 }")
    List<SchoolClass> findAllByTenantId(String tenantId);

    @Query("{ 'name': ?0, 'tenantId': ?1 }")
    Optional<SchoolClass> findByNameAndTenantId(String name, String tenantId);

    @Query(value = "{ 'name': ?0, 'tenantId': ?1 }", exists = true)
    boolean existsByNameAndTenantId(String name, String tenantId);

    @Query(value = "{ 'code': ?0 }", exists = true)
    boolean existsByCode(String code);
}