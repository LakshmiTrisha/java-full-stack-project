package com.community.emergency.repository;

import com.community.emergency.model.HelpRequest;
import com.community.emergency.model.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HelpRequestRepository extends JpaRepository<HelpRequest, Long> {
    List<HelpRequest> findByStatus(RequestStatus status);
}
