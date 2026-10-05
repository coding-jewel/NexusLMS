package com.nexuslms.engine.service;

import java.util.Set;
import java.util.regex.Pattern;

public final class SubdomainRules {
    private static final Set<String> RESERVED = Set.of("www", "app", "api", "admin", "mail", "support", "help");
    private static final Pattern VALID = Pattern.compile("^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$");

    private SubdomainRules() {}

    public static String normalize(String raw) {
        return raw == null ? "" : raw.trim().toLowerCase();
    }

    /** Returns a message the user can read, or null when the subdomain is acceptable. */
    public static String problem(String subdomain) {
        if (!VALID.matcher(subdomain).matches()) {
            return "Use 3 to 30 letters, numbers or hyphens, and don't start or end with a hyphen.";
        }
        if (RESERVED.contains(subdomain)) {
            return "\"" + subdomain + "\" is reserved. Choose another address.";
        }
        return null;
    }
}