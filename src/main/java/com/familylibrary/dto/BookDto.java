package com.familylibrary.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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
    private LocalDateTime addedDate;
    private UserDto addedBy; // Who added the book (simplified to UserDto)
    private Integer totalPages;
    private String language;
    // Potentially other fields like averageRating, tags, etc.
} 