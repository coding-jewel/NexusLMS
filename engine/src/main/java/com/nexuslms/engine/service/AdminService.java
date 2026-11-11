package com.nexuslms.engine.service;

import com.nexuslms.engine.models.*;
import com.nexuslms.engine.repository.*;
import com.nexuslms.engine.security.AuthUser;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

@Service
public class AdminService {

    private final MongoTemplate mongoTemplate;
    private final TenantRepository tenantRepository;

    public AdminService(MongoTemplate mongoTemplate, TenantRepository tenantRepository) {
        this.mongoTemplate = mongoTemplate;
        this.tenantRepository = tenantRepository;
    }

    public void clearData(AuthUser auth) {
        String tenantId = auth.tenantId();
        String adminId = auth.userId();

        // Delete all students and teachers in this tenant, but keep the admin
        Query usersQuery = new Query(Criteria.where("tenantId").is(tenantId).and("_id").ne(adminId));
        mongoTemplate.remove(usersQuery, User.class);

        clearTenantCollections(tenantId);
    }

    public void deleteSchool(AuthUser auth) {
        String tenantId = auth.tenantId();

        // Delete EVERYONE, including the admin
        mongoTemplate.remove(new Query(Criteria.where("tenantId").is(tenantId)), User.class);

        // Delete all school data
        clearTenantCollections(tenantId);

        // Delete the tenant itself
        tenantRepository.deleteById(tenantId);
    }

    private void clearTenantCollections(String tenantId) {
        mongoTemplate.remove(new Query(Criteria.where("tenantId").is(tenantId)), SchoolClass.class);
        mongoTemplate.remove(new Query(Criteria.where("tenantId").is(tenantId)), Course.class);
        mongoTemplate.remove(new Query(Criteria.where("tenantId").is(tenantId)), Assignment.class);
        mongoTemplate.remove(new Query(Criteria.where("tenantId").is(tenantId)), Quiz.class);
        mongoTemplate.remove(new Query(Criteria.where("tenantId").is(tenantId)), Submission.class);
        mongoTemplate.remove(new Query(Criteria.where("tenantId").is(tenantId)), QuizAttempt.class);
        mongoTemplate.remove(new Query(Criteria.where("tenantId").is(tenantId)), Grade.class);
    }
}