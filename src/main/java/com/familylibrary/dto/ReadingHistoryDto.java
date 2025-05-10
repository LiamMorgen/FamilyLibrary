package com.familylibrary.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ReadingHistoryDto {
    private Long id;
    private Long userId;
    private String username; // For convenience
    private Long bookId;
    private String bookTitle; // For convenience
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer rating;
    private String notes;
} 