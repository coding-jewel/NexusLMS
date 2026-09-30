package com.nexuslms.engine.repository;

import com.nexuslms.engine.models.Tenant;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TenantRepository extends MongoRepository<Tenant, String> {

    @Query("{ 'subdomain': ?0 }")
    Optional<Tenant> findBySubdomain(String subdomain);

    @Query(value = "{ 'subdomain': ?0 }", exists = true)
    boolean existsBySubdomain(String subdomain);
}
