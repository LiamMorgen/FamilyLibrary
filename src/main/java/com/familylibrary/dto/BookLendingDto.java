package com.familylibrary.dto;

import com.familylibrary.model.LendingStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BookLendingDto {
    private Long id;
    private Long bookId;
    private String bookTitle; // Convenience
    private Long lenderId;
    private String lenderUsername; // Convenience
    private Long borrowerId;
    private String borrowerUsername; // Convenience
    private LocalDateTime lendDate;
    private LocalDateTime dueDate;
    private LocalDateTime returnDate; // Nullable
    private LendingStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 