package com.nexuslms.engine.security;

import java.security.Principal;

// The signed-in user, built from the token. It implements Principal,
// so authentication.getName() still returns the email like before.
public record AuthUser(String userId, String email, String tenantId, String role) implements Principal {
    @Override
    public String getName() {
        return email;
    }
}