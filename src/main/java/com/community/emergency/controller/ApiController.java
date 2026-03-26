package com.community.emergency.controller;

import com.community.emergency.model.*;
import com.community.emergency.repository.HelpRequestRepository;
import com.community.emergency.repository.ResourceCenterRepository;
import com.community.emergency.repository.VolunteerOfferRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class ApiController {

    private final ResourceCenterRepository resourceCenterRepository;
    private final HelpRequestRepository helpRequestRepository;
    private final VolunteerOfferRepository volunteerOfferRepository;

    public ApiController(ResourceCenterRepository resourceCenterRepository,
                         HelpRequestRepository helpRequestRepository,
                         VolunteerOfferRepository volunteerOfferRepository) {
        this.resourceCenterRepository = resourceCenterRepository;
        this.helpRequestRepository = helpRequestRepository;
        this.volunteerOfferRepository = volunteerOfferRepository;
    }

    @GetMapping("/resource-types")
    public ResourceType[] getResourceTypes() {
        return ResourceType.values();
    }

    @GetMapping("/resources")
    public List<ResourceCenter> getResources(@RequestParam(required = false) ResourceType type,
                                             @RequestParam(defaultValue = "true") boolean onlyActive) {
        if (type != null) {
            return resourceCenterRepository.findByType(type).stream()
                    .filter(r -> !onlyActive || r.isActive())
                    .toList();
        }
        if (onlyActive) {
            return resourceCenterRepository.findByActiveTrue();
        }
        return resourceCenterRepository.findAll();
    }

    @PostMapping("/resources")
    @ResponseStatus(HttpStatus.CREATED)
    public ResourceCenter createResource(@Valid @RequestBody ResourceCenter resourceCenter) {
        return resourceCenterRepository.save(resourceCenter);
    }

    @GetMapping("/requests")
    public List<HelpRequest> getRequests(@RequestParam(required = false) RequestStatus status) {
        if (status != null) {
            return helpRequestRepository.findByStatus(status);
        }
        return helpRequestRepository.findAll();
    }

    @PostMapping("/requests")
    @ResponseStatus(HttpStatus.CREATED)
    public HelpRequest createRequest(@Valid @RequestBody HelpRequest helpRequest) {
        helpRequest.setStatus(RequestStatus.OPEN);
        helpRequest.setAssignedCenter(null);
        return helpRequestRepository.save(helpRequest);
    }

    @PatchMapping("/requests/{requestId}/assign")
    public HelpRequest assignRequest(@PathVariable Long requestId, @RequestParam Long centerId) {
        HelpRequest helpRequest = helpRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));

        ResourceCenter center = resourceCenterRepository.findById(centerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource center not found"));

        helpRequest.setAssignedCenter(center);
        helpRequest.setStatus(RequestStatus.IN_PROGRESS);
        return helpRequestRepository.save(helpRequest);
    }

    @PatchMapping("/requests/{requestId}/status")
    public HelpRequest updateRequestStatus(@PathVariable Long requestId,
                                           @RequestParam RequestStatus status) {
        HelpRequest helpRequest = helpRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        helpRequest.setStatus(status);
        return helpRequestRepository.save(helpRequest);
    }

    @GetMapping("/volunteers")
    public List<VolunteerOffer> getVolunteers() {
        return volunteerOfferRepository.findAll();
    }

    @PostMapping("/volunteers")
    @ResponseStatus(HttpStatus.CREATED)
    public VolunteerOffer createVolunteer(@Valid @RequestBody VolunteerOffer volunteerOffer) {
        return volunteerOfferRepository.save(volunteerOffer);
    }

    @GetMapping("/dashboard")
    public Map<String, Long> getDashboardMetrics() {
        Map<String, Long> metrics = new HashMap<>();
        metrics.put("resourceCenters", resourceCenterRepository.count());
        metrics.put("openRequests", (long) helpRequestRepository.findByStatus(RequestStatus.OPEN).size());
        metrics.put("inProgressRequests", (long) helpRequestRepository.findByStatus(RequestStatus.IN_PROGRESS).size());
        metrics.put("resolvedRequests", (long) helpRequestRepository.findByStatus(RequestStatus.RESOLVED).size());
        metrics.put("volunteers", volunteerOfferRepository.count());
        return metrics;
    }
}
