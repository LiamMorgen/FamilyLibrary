package com.familylibrary.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateBookRequest {

    @NotBlank(message = "Title cannot be blank")
    private String title;

    private String author;

    private String isbn; // Consider adding ISBN validation if needed

    private String publisher;

    private LocalDate publicationDate;

    private String genre;

    private String coverImageUrl;

    private String description;

    @NotNull(message = "Bookshelf ID cannot be null")
    private Long bookshelfId;

    @Positive(message = "Shelf number must be positive")
    private Integer shelfNumber; // Optional: specific shelf in the bookshelf

    @Positive(message = "Position on shelf must be positive")
    private Integer positionOnShelf; // Optional: specific position on the shelf
} 