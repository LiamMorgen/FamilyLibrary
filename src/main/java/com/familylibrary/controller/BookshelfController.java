package com.familylibrary.controller;

import com.familylibrary.dto.BookshelfDto;
import com.familylibrary.dto.CreateBookshelfRequest;
import com.familylibrary.dto.UpdateBookshelfRequest;
import com.familylibrary.service.BookshelfService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookshelves")
@RequiredArgsConstructor
public class BookshelfController {

    private final BookshelfService bookshelfService;

    @PostMapping
    public ResponseEntity<BookshelfDto> createBookshelf(@Valid @RequestBody CreateBookshelfRequest request) {
        BookshelfDto createdBookshelf = bookshelfService.createBookshelf(request);
        return new ResponseEntity<>(createdBookshelf, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookshelfDto> getBookshelfById(@PathVariable Long id) {
        BookshelfDto bookshelf = bookshelfService.getBookshelfById(id);
        return ResponseEntity.ok(bookshelf);
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<BookshelfDto>> getBookshelvesByOwner(@PathVariable Long ownerId) {
        List<BookshelfDto> bookshelves = bookshelfService.getBookshelvesByOwner(ownerId);
        return ResponseEntity.ok(bookshelves);
    }

    @GetMapping("/family/{familyId}")
    public ResponseEntity<List<BookshelfDto>> getBookshelvesByFamily(@PathVariable Long familyId) {
        // Further filtering for private bookshelves (if user is not owner) should be handled based on auth context
        List<BookshelfDto> bookshelves = bookshelfService.getBookshelvesByFamily(familyId);
        return ResponseEntity.ok(bookshelves);
    }

    @GetMapping
    public ResponseEntity<List<BookshelfDto>> getAllBookshelves() {
        // 这需要一个服务方法来获取当前用户有权访问的所有书架
        // 或者一个更通用的 "list all" 方法，然后可能在服务层或查询时进行权限过滤
        List<BookshelfDto> bookshelves = bookshelfService.getAllVisibleBookshelvesForCurrentUser(); // 假设有这样一个方法
        return ResponseEntity.ok(bookshelves);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookshelfDto> updateBookshelf(@PathVariable Long id, @Valid @RequestBody UpdateBookshelfRequest request) {
        // Add authorization: ensure the authenticated user is the owner of the bookshelf
        BookshelfDto updatedBookshelf = bookshelfService.updateBookshelf(id, request);
        return ResponseEntity.ok(updatedBookshelf);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBookshelf(@PathVariable Long id) {
        // Add authorization: ensure the authenticated user is the owner of the bookshelf
        bookshelfService.deleteBookshelf(id);
        return ResponseEntity.noContent().build();
    }
} 