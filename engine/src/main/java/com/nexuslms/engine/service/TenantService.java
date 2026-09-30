package com.nexuslms.engine.service;

import com.nexuslms.engine.exception.DuplicateResourceException;
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
        return tenantRepository.save(tenant);
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