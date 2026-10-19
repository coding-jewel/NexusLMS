package com.nexuslms.engine.repository;

import com.nexuslms.engine.models.PasswordResetToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PasswordResetTokenRepository extends MongoRepository<PasswordResetToken, String> {
}