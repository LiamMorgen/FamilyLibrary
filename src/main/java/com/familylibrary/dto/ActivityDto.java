package com.familylibrary.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ActivityDto {
    private Long id;
    private Long userId;
    private String username; // Convenience
    private String activityType;
    private Long bookId; // Nullable
    private String bookTitle; // Nullable, convenience
    private Long relatedUserId; // Nullable
    private String relatedUsername; // Nullable, convenience
    private LocalDateTime timestamp;
    private String data; // JSON string
} 