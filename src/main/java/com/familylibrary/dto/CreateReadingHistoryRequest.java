package com.familylibrary.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CreateReadingHistoryRequest {

    @NotNull(message = "User ID cannot be null")
    private Long userId;

    @NotNull(message = "Book ID cannot be null")
    private Long bookId;

    @PastOrPresent(message = "Start date must be in the past or present")
    private LocalDateTime startDate; // Optional, defaults to now in Entity

    private LocalDateTime endDate;

    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating; // Assuming a 1-5 rating scale

    private String notes;
} 