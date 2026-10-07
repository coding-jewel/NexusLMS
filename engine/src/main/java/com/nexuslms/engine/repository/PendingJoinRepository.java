package com.nexuslms.engine.repository;

import com.nexuslms.engine.models.PendingJoin;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PendingJoinRepository extends MongoRepository<PendingJoin, String> {
}