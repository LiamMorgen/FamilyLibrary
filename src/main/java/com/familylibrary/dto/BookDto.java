package com.familylibrary.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookDto {
    private Long id;
    private String title;
    private String author;
    private String isbn;
    private String publisher;
    private LocalDate publicationDate;
    private String genre;
    private String summary;
    private String coverImageUrl;
    private String status; // e.g., available, borrowed, reading
    private Long bookshelfId; // To know which bookshelf it belongs to
    private String bookshelfName; // Optional: denormalized for convenience
    private ShelfPositionDto shelfPosition; // Added
    private LocalDateTime addedDate;
    private UserDto addedBy; // Who added the book (simplified to UserDto)
    private Integer totalPages;
    private String language;

    // Fields for current lending information if applicable
    private Long currentLendingId;
    private UserDto currentBorrower; // Contains id, username, displayName
    // Potentially other fields like averageRating, tags, etc.
} 