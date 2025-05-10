package com.familylibrary.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateBookshelfRequest {

    @Size(min = 1, max = 100, message = "Bookshelf name must be between 1 and 100 characters")
    private String name; // Optional

    @Min(value = 1, message = "Number of shelves must be at least 1")
    private Integer numShelves; // Optional

    private Boolean isPrivate; // Optional

    // ownerId and familyId are typically not updatable via this request
} 