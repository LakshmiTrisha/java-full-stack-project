package com.community.emergency.config;

import com.community.emergency.model.*;
import com.community.emergency.repository.HelpRequestRepository;
import com.community.emergency.repository.ResourceCenterRepository;
import com.community.emergency.repository.VolunteerOfferRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seedData(ResourceCenterRepository resourceCenterRepository,
                               HelpRequestRepository helpRequestRepository,
                               VolunteerOfferRepository volunteerOfferRepository) {
        return args -> {
            if (resourceCenterRepository.count() == 0) {
                ResourceCenter shelter = new ResourceCenter();
                shelter.setName("Central Relief Shelter");
                shelter.setType(ResourceType.SHELTER);
                shelter.setLocation("Downtown Ward 4");
                shelter.setContact("+91-90000-11111");
                shelter.setActive(true);
                resourceCenterRepository.save(shelter);

                ResourceCenter medical = new ResourceCenter();
                medical.setName("Rapid Medical Camp");
                medical.setType(ResourceType.MEDICAL);
                medical.setLocation("Riverbank Zone");
                medical.setContact("+91-90000-22222");
                medical.setActive(true);
                resourceCenterRepository.save(medical);

                ResourceCenter food = new ResourceCenter();
                food.setName("Community Kitchen Hub");
                food.setType(ResourceType.FOOD);
                food.setLocation("East Market Area");
                food.setContact("+91-90000-33333");
                food.setActive(true);
                resourceCenterRepository.save(food);
            }

            if (helpRequestRepository.count() == 0) {
                HelpRequest request = new HelpRequest();
                request.setRequesterName("Anita Sharma");
                request.setPhone("+91-98765-10001");
                request.setArea("North Colony");
                request.setDescription("Need drinking water for 10 families.");
                request.setStatus(RequestStatus.OPEN);
                helpRequestRepository.save(request);
            }

            if (volunteerOfferRepository.count() == 0) {
                VolunteerOffer volunteerOffer = new VolunteerOffer();
                volunteerOffer.setName("Rahul Verma");
                volunteerOffer.setPhone("+91-98765-20002");
                volunteerOffer.setSkill("Transport and Delivery");
                volunteerOffer.setAvailability("Evenings");
                volunteerOfferRepository.save(volunteerOffer);
            }
        };
    }
}
