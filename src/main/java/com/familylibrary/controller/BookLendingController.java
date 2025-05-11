package com.familylibrary.controller;

import com.familylibrary.dto.BookLendingDto;
import com.familylibrary.service.BookLendingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    @GetMapping("/my-active")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BookLendingDto>> getMyActiveLendings() {
        List<BookLendingDto> activeLendings = bookLendingService.getMyActiveLendings();
        return ResponseEntity.ok(activeLendings);
    }

    @GetMapping("/my-active/count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Long> countMyActiveLendings() {
        long count = bookLendingService.countMyActiveLendings();
        return ResponseEntity.ok(count);
    }

    @GetMapping("/my-total/count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Long> countMyTotalLendings() {
        long count = bookLendingService.countTotalLendingsForCurrentUser();
        return ResponseEntity.ok(count);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookLendingDto> createBookLending(@RequestBody BookLendingDto bookLendingDto) {
        BookLendingDto createdLending = bookLendingService.createBookLending(bookLendingDto);
        return ResponseEntity.status(201).body(createdLending);
    }

    @PatchMapping("/{id}/return")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookLendingDto> returnBook(@PathVariable Long id) {
        BookLendingDto updatedLending = bookLendingService.returnBook(id);
        return ResponseEntity.ok(updatedLending);
    }
} 