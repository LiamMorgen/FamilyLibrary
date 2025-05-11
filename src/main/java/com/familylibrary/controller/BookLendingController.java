package com.familylibrary.controller;

import com.familylibrary.dto.BookLendingDto;
import com.familylibrary.service.BookLendingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/book-lendings")
@RequiredArgsConstructor
public class BookLendingController {

    private final BookLendingService bookLendingService;

    @GetMapping
    public ResponseEntity<List<BookLendingDto>> getBookLendings(
            @RequestParam(required = false) String lenderId, // "current" or actual user ID
            @RequestParam(required = false) String borrowerId, // "current" or actual user ID
            @RequestParam(required = false) Long bookId) {
        List<BookLendingDto> lendings = bookLendingService.getBookLendings(lenderId, borrowerId, bookId);
        return ResponseEntity.ok(lendings);
    }

    @PostMapping
    public ResponseEntity<BookLendingDto> createBookLending(@RequestBody BookLendingDto bookLendingDto) {
        BookLendingDto createdLending = bookLendingService.createBookLending(bookLendingDto);
        return ResponseEntity.status(201).body(createdLending);
    }

    @PatchMapping("/{id}/return")
    public ResponseEntity<BookLendingDto> returnBook(@PathVariable Long id) {
        BookLendingDto updatedLending = bookLendingService.returnBook(id);
        return ResponseEntity.ok(updatedLending);
    }
} 