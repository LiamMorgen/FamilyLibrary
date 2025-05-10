package com.familylibrary.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateFamilyRequest {
    @NotBlank(message = "Family name cannot be blank")
    @Size(min = 2, max = 100, message = "Family name must be between 2 and 100 characters")
    private String name;
} 