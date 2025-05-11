package com.familylibrary.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.Map;

@Data
public class UpdateBookshelfRequest {

    @Size(min = 1, max = 100, message = "Bookshelf name must be between 1 and 100 characters")
    private String name; // Optional

    @Min(value = 1, message = "Number of shelves must be at least 1")
    private Integer numShelves; // Optional

    private Boolean isPrivate; // Optional

    // Optional: Allows updating shelf names. 
    // If numShelves is also changed, client should send a complete map for the new number of shelves.
    private Map<Integer, String> shelfNames;

    // ownerId and familyId are typically not updatable via this request
} 