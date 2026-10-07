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

    // is this email used by anyone, in any school and any role?
    @Query(value = "{ 'email': ?0 }", exists = true)
    boolean existsByEmail(String email);

    // is this email used by someone with this role, in any school?
    @Query(value = "{ 'email': ?0, 'role': ?1 }", exists = true)
    boolean existsByEmailAndRole(String email, String role);

    @Query("{ 'tenantId': ?0 }")
    List<User> findAllByTenantId(String tenantId);

    // fixed: the comma between the two fields was missing
    @Query("{ 'tenantId': ?0, 'role': ?1 }")
    List<User> findAllByTenantIdAndRole(String tenantId, String role);

    @Query(value = "{ 'classIds': ?0 }", exists = true)
    boolean existsByClassId(String classId);

    // how many people of one role a school has
    @Query(value = "{ 'tenantId': ?0, 'role': ?1 }", count = true)
    long countByTenantIdAndRole(String tenantId, String role);

    // how many people of one role a school has who have been approved (used for the teachers stat)
    @Query(value = "{ 'tenantId': ?0, 'role': ?1, 'approved': true }", count = true)
    long countByTenantIdAndRoleAndApproved(String tenantId, String role);

    // how many people of one role a school has who are still waiting (used for the pending note)
    @Query(value = "{ 'tenantId': ?0, 'role': ?1, 'approved': false }", count = true)
    long countByTenantIdAndRoleAndNotApproved(String tenantId, String role);
}