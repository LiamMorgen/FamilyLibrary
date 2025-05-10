package com.familylibrary.dto;

import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UpdateReadingHistoryRequest {

    @PastOrPresent(message = "Start date must be in the past or present")
    private LocalDateTime startDate;

    private LocalDateTime endDate;

    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;

    private String notes;
} 