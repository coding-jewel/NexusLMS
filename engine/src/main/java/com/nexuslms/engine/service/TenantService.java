package com.nexuslms.engine.service;

import com.nexuslms.engine.exception.DuplicateResourceException;
import org.springframework.dao.DuplicateKeyException;
import com.nexuslms.engine.models.Tenant;
import com.nexuslms.engine.repository.TenantRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TenantService {

    private final TenantRepository tenantRepository;

    public TenantService(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    public Tenant createTenant(Tenant tenant) {
        if (tenantRepository.existsBySubdomain(tenant.getSubdomain())) {
            throw new DuplicateResourceException("Subdomain already in use");
        }
        try {
            return tenantRepository.save(tenant);
        } catch (DuplicateKeyException e) {
            // two people claimed the same address at the same moment; the unique index decided
            throw new DuplicateResourceException("Subdomain already in use");
        }
    }

    public boolean isSubdomainTaken(String subdomain) {
        return tenantRepository.existsBySubdomain(subdomain);
    }

    public List<Tenant> getAllTenants() {
        return tenantRepository.findAll();
    }

    public Optional<Tenant> getTenantById(String id) {
        return tenantRepository.findById(id);
    }

    public Optional<Tenant> getTenantBySubdomain(String subdomain) {
        return tenantRepository.findBySubdomain(subdomain);
    }

    public void deleteTenant(String id) {
        tenantRepository.deleteById(id);
    }
}