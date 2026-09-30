package com.nexuslms.engine.repository;

import com.nexuslms.engine.models.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    @Query("{ 'email': ?0, 'tenantId': ?1}")
    Optional<User> findByEmailAndTenantId(String email, String tenantId);

    @Query(value = "{'email': ?0, 'tenantId': ?1}", exists = true)
    boolean existsByEmailAndTenantId(String email, String tenantId);

    @Query("{ 'tenantId': ?0 }")
    List<User> findAllByTenantId(String tenantId);

    @Query("{ 'tenantId': ?0 'role': ?1 }")
    List<User> findAllByTenantIdAndRole(String tenantId, String role);
}
