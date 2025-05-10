package com.familylibrary.controller;

import com.familylibrary.dto.ActivityDto;
import com.familylibrary.dto.CreateActivityRequest;
import com.familylibrary.service.ActivityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @PostMapping
    public ResponseEntity<ActivityDto> createActivity(@Valid @RequestBody CreateActivityRequest request) {
        ActivityDto createdActivity = activityService.createActivity(request);
        return new ResponseEntity<>(createdActivity, HttpStatus.CREATED);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ActivityDto>> getActivitiesForUser(
            @PathVariable Long userId,
            @RequestParam(required = false) String type) { // Optional filter by activity type
        List<ActivityDto> activities = activityService.getActivitiesForUser(userId, type);
        return ResponseEntity.ok(activities);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActivityDto> getActivityById(@PathVariable Long id) {
        ActivityDto activity = activityService.getActivityById(id);
        return ResponseEntity.ok(activity);
    }

    @GetMapping
    public ResponseEntity<List<ActivityDto>> getAllActivities(@RequestParam(required = false) String type) {
        List<ActivityDto> activities = activityService.getAllVisibleActivitiesForCurrentUser(type);
        return ResponseEntity.ok(activities);
    }
    
    // As activities are generally immutable logs, PUT and DELETE endpoints are typically not provided.
} 