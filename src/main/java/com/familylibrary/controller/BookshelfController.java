package com.familylibrary.controller;

import com.familylibrary.dto.BookshelfDto;
import com.familylibrary.dto.CreateBookshelfRequest;
import com.familylibrary.dto.UpdateBookshelfRequest;
import com.familylibrary.model.Family;
import com.familylibrary.model.User;
import com.familylibrary.repository.UserRepository;
import com.familylibrary.service.BookshelfService;
import com.familylibrary.service.FamilyService;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/bookshelves")
@RequiredArgsConstructor
public class BookshelfController {

    private final BookshelfService bookshelfService;
    private final UserRepository userRepository;
    private final FamilyService familyService;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new IllegalStateException("User not authenticated. Anonymous access not allowed for this operation.");
        }
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("Current user (username: " + username + ") not found in database."));
    }

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

    @GetMapping("/owner/{ownerIdOrCurrent}")
    public ResponseEntity<List<BookshelfDto>> getBookshelvesByOwner(@PathVariable String ownerIdOrCurrent) {
        Long actualOwnerId;
        if ("current".equalsIgnoreCase(ownerIdOrCurrent)) {
            try {
                actualOwnerId = getCurrentUser().getId();
            } catch (IllegalStateException | EntityNotFoundException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.emptyList());
            }
        } else {
            try {
                actualOwnerId = Long.parseLong(ownerIdOrCurrent);
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Collections.emptyList());
            }
        }
        List<BookshelfDto> bookshelves = bookshelfService.getBookshelvesByOwner(actualOwnerId);
        return ResponseEntity.ok(bookshelves);
    }

    @GetMapping("/family/{familyIdOrCurrent}")
    public ResponseEntity<List<BookshelfDto>> getBookshelvesByFamily(@PathVariable String familyIdOrCurrent) {
        Long actualFamilyId;
        if ("current".equalsIgnoreCase(familyIdOrCurrent)) {
            User currentUser;
            try {
                currentUser = getCurrentUser();
            } catch (IllegalStateException | EntityNotFoundException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.emptyList());
            }
            
            Set<Family> families = currentUser.getFamilies(); 
            if (families == null || families.isEmpty()) {
                return ResponseEntity.ok(Collections.emptyList());
            }
            actualFamilyId = families.stream().findFirst()
                                   .map(Family::getId)
                                   .orElseThrow(() -> new EntityNotFoundException("User has families but could not retrieve an ID. This should not happen if families set is not empty."));
        } else {
            try {
                actualFamilyId = Long.parseLong(familyIdOrCurrent);
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Collections.emptyList());
            }
        }
        List<BookshelfDto> bookshelves = bookshelfService.getBookshelvesByFamily(actualFamilyId);
        return ResponseEntity.ok(bookshelves);
    }

    @GetMapping
    public ResponseEntity<List<BookshelfDto>> getAllBookshelves() {
        List<BookshelfDto> bookshelves = bookshelfService.getAllVisibleBookshelvesForCurrentUser();
        return ResponseEntity.ok(bookshelves);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookshelfDto> updateBookshelf(@PathVariable Long id, @Valid @RequestBody UpdateBookshelfRequest request) {
        BookshelfDto updatedBookshelf = bookshelfService.updateBookshelf(id, request);
        return ResponseEntity.ok(updatedBookshelf);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBookshelf(@PathVariable Long id) {
        bookshelfService.deleteBookshelf(id);
        return ResponseEntity.noContent().build();
    }
} 