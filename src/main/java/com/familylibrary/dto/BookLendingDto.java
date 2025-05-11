package com.familylibrary.dto;

import com.familylibrary.model.LendingStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BookLendingDto {
    private Long id;
    private Long bookId;
    private String bookTitle; // Convenience
    private String bookCoverImage; // Added for UI
    private Long lenderId;
    private String lenderName; // Changed from lenderUsername for consistency with UI needs
    private Long borrowerId;
    private String borrowerName; // Changed from borrowerUsername for consistency with UI needs
    private LocalDateTime lendDate;
    private LocalDateTime dueDate;
    private LocalDateTime returnDate; // Nullable
    private LendingStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 