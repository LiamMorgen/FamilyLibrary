package com.familylibrary.controller;

import com.familylibrary.dto.BookDto;
import com.familylibrary.dto.CreateBookRequest;
import com.familylibrary.service.BookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;

    @GetMapping
    public ResponseEntity<List<BookDto>> getAllBooks(
            @RequestParam(required = false) Long bookshelfId,
            @RequestParam(required = false) String query, // For search term
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String sort // e.g., "addedDate_desc"
    ) {
        if (query != null && !query.trim().isEmpty()) {
            List<BookDto> books = bookService.searchBooks(query);
            return ResponseEntity.ok(books);
        }
        List<BookDto> books = bookService.getAllBooks(bookshelfId, null, limit, sort);
        return ResponseEntity.ok(books); 
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookDto> getBookById(@PathVariable Long id) {
        BookDto book = bookService.getBookById(id);
        return ResponseEntity.ok(book);
    }

    @PostMapping
    public ResponseEntity<BookDto> createBook(@Valid @RequestBody CreateBookRequest createBookRequest) {
        BookDto createdBook = bookService.createBook(createBookRequest);
        return new ResponseEntity<>(createdBook, HttpStatus.CREATED);
    }

    // TODO: Add PUT /api/books/{id} to update a book
    // TODO: Add DELETE /api/books/{id} to delete a book
} 