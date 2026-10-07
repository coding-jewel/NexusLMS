package com.nexuslms.engine.service;

import com.nexuslms.engine.exception.NotFoundException;
import com.nexuslms.engine.models.Tenant;
import com.nexuslms.engine.repository.TenantRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

// The school's teacher join code. The school always comes from the signed-in admin, never from the request.
@Service
public class TeacherCodeService {

    private final TenantRepository tenantRepository;

    public TeacherCodeService(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    /** The school's current code. Schools that don't have one yet get one the first time it is asked for. */
    public String get(String tenantId) {
        Tenant tenant = tenant(tenantId);
        if (tenant.getTeacherCode() != null) {
            return tenant.getTeacherCode();
        }
        return assignNewCode(tenant);
    }

    /** Replaces the code. The old code, and any invite link that used it, stops working. */
    public String regenerate(String tenantId) {
        return assignNewCode(tenant(tenantId));
    }

    private Tenant tenant(String tenantId) {
        return tenantRepository.findById(tenantId).orElseThrow(() -> new NotFoundException("School not found"));
    }

    private String assignNewCode(Tenant tenant) {
        for (int attempt = 0; attempt < 10; attempt++) {
            String code = TeacherCodes.generate();
            if (tenantRepository.existsByTeacherCode(code)) {
                continue;
            }
            tenant.setTeacherCode(code);
            try {
                tenantRepository.save(tenant);
                return code;
            } catch (DuplicateKeyException e) {
                // another school got that code at the same moment; try another
            }
        }
        throw new IllegalStateException("Could not create a unique teacher code");
    }
}