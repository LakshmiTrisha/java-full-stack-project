package com.community.emergency.repository;

import com.community.emergency.model.ResourceCenter;
import com.community.emergency.model.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResourceCenterRepository extends JpaRepository<ResourceCenter, Long> {
    List<ResourceCenter> findByType(ResourceType type);
    List<ResourceCenter> findByActiveTrue();
}
