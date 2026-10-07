package com.nexuslms.engine.service;

import com.nexuslms.engine.dto.StatsResponse;
import com.nexuslms.engine.models.Role;
import com.nexuslms.engine.repository.CourseRepository;
import com.nexuslms.engine.repository.SchoolClassRepository;
import com.nexuslms.engine.repository.UserRepository;
import org.springframework.stereotype.Service;

// Counts for one school. The school always comes from the signed-in user, never from the request.
@Service
public class StatsService {

    private final SchoolClassRepository classRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    public StatsService(SchoolClassRepository classRepository, UserRepository userRepository,
                        CourseRepository courseRepository) {
        this.classRepository = classRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
    }

    public StatsResponse forSchool(String tenantId) {
        return new StatsResponse(
                classRepository.countByTenantId(tenantId),
                userRepository.countByTenantIdAndRoleAndApproved(tenantId, Role.TEACHER.name()),
                userRepository.countByTenantIdAndRole(tenantId, Role.STUDENT.name()),
                courseRepository.countByTenantId(tenantId),
                userRepository.countByTenantIdAndRoleAndNotApproved(tenantId, Role.TEACHER.name()));
    }
}