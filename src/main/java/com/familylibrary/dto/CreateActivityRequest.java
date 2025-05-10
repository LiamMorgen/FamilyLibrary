package com.familylibrary.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
// It might be good to define an enum for activity types later
// import com.familylibrary.model.enums.ActivityType;

@Data
public class CreateActivityRequest {

    @NotNull(message = "User ID cannot be null")
    private Long userId;

    @NotBlank(message = "Activity type cannot be blank")
    private String activityType; // e.g., "ADD_BOOK", "BORROW_BOOK", "RATE_BOOK"

    private Long bookId; // Optional

    private Long relatedUserId; // Optional, e.g., for sharing or lending events

    private String data; // Optional, JSON string for additional data
    
    // Timestamp will typically be set by the server
} 