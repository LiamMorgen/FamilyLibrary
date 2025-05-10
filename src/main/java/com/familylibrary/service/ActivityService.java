package com.familylibrary.service;

import com.familylibrary.dto.ActivityDto;
import com.familylibrary.dto.CreateActivityRequest;
import com.familylibrary.model.Activity;
import com.familylibrary.model.Book;
import com.familylibrary.model.User;
import com.familylibrary.repository.ActivityRepository;
import com.familylibrary.repository.BookRepository;
import com.familylibrary.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    @Transactional
    public ActivityDto createActivity(CreateActivityRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + request.getUserId()));

        Book book = null;
        if (request.getBookId() != null) {
            book = bookRepository.findById(request.getBookId())
                    .orElseThrow(() -> new EntityNotFoundException("Book not found with id: " + request.getBookId()));
        }

        User relatedUser = null;
        if (request.getRelatedUserId() != null) {
            relatedUser = userRepository.findById(request.getRelatedUserId())
                    .orElseThrow(() -> new EntityNotFoundException("Related user not found with id: " + request.getRelatedUserId()));
        }

        Activity activity = new Activity();
        activity.setUser(user);
        activity.setActivityType(request.getActivityType());
        activity.setBook(book); // Can be null
        activity.setRelatedUser(relatedUser); // Can be null
        activity.setData(request.getData()); // Can be null
        // Timestamp is set by @PrePersist in Activity entity

        Activity savedActivity = activityRepository.save(activity);
        return convertToDto(savedActivity);
    }

    @Transactional(readOnly = true)
    public List<ActivityDto> getActivitiesForUser(Long userId, String activityType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
        
        List<Activity> activities;
        if (activityType != null && !activityType.isBlank()) {
            activities = activityRepository.findByUserAndActivityTypeOrderByTimestampDesc(user, activityType);
        } else {
            activities = activityRepository.findByUserOrderByTimestampDesc(user);
        }
        
        return activities.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public ActivityDto getActivityById(Long id) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Activity not found with id: " + id));
        return convertToDto(activity);
    }

    public List<ActivityDto> getAllVisibleActivitiesForCurrentUser(String type) {
        // TODO: Implement logic to get all activities visible to the current user.
        // This might involve: 
        // 1. Getting the current authenticated user from Spring Security context.
        // 2. Fetching activities based on user ID, family ID, or other visibility rules.
        // 3. Filtering by 'type' if provided.
        // 4. Converting to ActivityDto.

        System.out.println("DEBUG: ActivityService.getAllVisibleActivitiesForCurrentUser(type: " + type + ") called - placeholder implementation. Returning empty list.");
        return new ArrayList<>(); // Placeholder
    }
    
    // We might not need a public delete method for activities, as they are often audit logs.
    // If deletion is required, it can be added here.

    private ActivityDto convertToDto(Activity activity) {
        ActivityDto dto = new ActivityDto();
        dto.setId(activity.getId());
        dto.setUserId(activity.getUser().getId());
        dto.setUsername(activity.getUser().getUsername()); // Or displayName
        dto.setActivityType(activity.getActivityType());
        dto.setTimestamp(activity.getTimestamp());
        dto.setData(activity.getData());

        if (activity.getBook() != null) {
            dto.setBookId(activity.getBook().getId());
            dto.setBookTitle(activity.getBook().getTitle());
        }

        if (activity.getRelatedUser() != null) {
            dto.setRelatedUserId(activity.getRelatedUser().getId());
            dto.setRelatedUsername(activity.getRelatedUser().getUsername()); // Or displayName
        }
        return dto;
    }
} 