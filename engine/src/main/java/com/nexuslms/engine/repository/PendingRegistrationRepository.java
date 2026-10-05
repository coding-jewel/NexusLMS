package com.nexuslms.engine.repository;

import com.nexuslms.engine.models.PendingRegistration;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PendingRegistrationRepository extends MongoRepository<PendingRegistration, String> {
}