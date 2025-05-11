package com.familylibrary.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateBookshelfRequest {

    @NotBlank(message = "Bookshelf name cannot be blank")
    @Size(min = 1, max = 100, message = "Bookshelf name must be between 1 and 100 characters")
    private String name;

    private Long ownerId;

    private Long familyId;

    @Min(value = 1, message = "Number of shelves must be at least 1")
    private Integer numShelves = 3; // Default from schema

    private Boolean isPrivate = false; // Default from schema
} 