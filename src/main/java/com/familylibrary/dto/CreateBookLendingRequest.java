package com.familylibrary.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CreateBookLendingRequest {

    @NotNull(message = "Book ID cannot be null")
    private Long bookId;

    @NotNull(message = "Lender ID cannot be null")
    private Long lenderId;

    @NotNull(message = "Borrower ID cannot be null")
    private Long borrowerId;

    // lendDate will be set to now() by default in service/entity

    @NotNull(message = "Due date cannot be null")
    @Future(message = "Due date must be in the future")
    private LocalDateTime dueDate;

    // status will be set to BORROWED by default in service
} 