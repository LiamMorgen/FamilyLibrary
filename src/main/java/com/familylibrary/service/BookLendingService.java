package com.familylibrary.service;

import com.familylibrary.dto.BookLendingDto;
import com.familylibrary.model.Book;
import com.familylibrary.model.BookLending;
import com.familylibrary.model.User;
import com.familylibrary.model.BookStatus;
import com.familylibrary.model.LendingStatus;
import com.familylibrary.repository.BookLendingRepository;
import com.familylibrary.repository.BookRepository;
import com.familylibrary.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookLendingService {

    private final BookLendingRepository bookLendingRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    // private final UserService userService; // May be needed for 'current' user resolution

    @Transactional(readOnly = true)
    public List<BookLendingDto> getBookLendings(String lenderIdStr, String borrowerIdStr, Long bookId) {
        Long currentActualUserId = getCurrentUserId(); // Helper to get current user's ID
        Long lenderId = resolveUserId(lenderIdStr, currentActualUserId);
        Long borrowerId = resolveUserId(borrowerIdStr, currentActualUserId);

        // TODO: Implement sophisticated filtering in repository based on combinations of these IDs
        // For now, a simple approach:
        if (lenderId != null) {
            User lender = userRepository.findById(lenderId).orElseThrow(() -> new EntityNotFoundException("Lender not found"));
            return bookLendingRepository.findByLender(lender).stream().map(this::convertToDto).collect(Collectors.toList());
        }
        if (borrowerId != null) {
            User borrower = userRepository.findById(borrowerId).orElseThrow(() -> new EntityNotFoundException("Borrower not found"));
            return bookLendingRepository.findByBorrower(borrower).stream().map(this::convertToDto).collect(Collectors.toList());
        }
        if (bookId != null) {
            Book book = bookRepository.findById(bookId).orElseThrow(() -> new EntityNotFoundException("Book not found"));
            return bookLendingRepository.findByBook(book).stream().map(this::convertToDto).collect(Collectors.toList());
        }
        return bookLendingRepository.findAll().stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Transactional
    public BookLendingDto createBookLending(BookLendingDto dto) {
        User lender = userRepository.findById(dto.getLenderId())
                .orElseThrow(() -> new EntityNotFoundException("Lender not found with id: " + dto.getLenderId()));
        User borrower = userRepository.findById(dto.getBorrowerId())
                .orElseThrow(() -> new EntityNotFoundException("Borrower not found with id: " + dto.getBorrowerId()));
        Book book = bookRepository.findById(dto.getBookId())
                .orElseThrow(() -> new EntityNotFoundException("Book not found with id: " + dto.getBookId()));

        if (!(BookStatus.AVAILABLE.equals(book.getStatus()) || book.getStatus() == null)) {
            throw new IllegalStateException("Book is not available for lending.");
        }

        BookLending lending = new BookLending();
        lending.setLender(lender);
        lending.setBorrower(borrower);
        lending.setBook(book);
        lending.setLendDate(dto.getLendDate() != null ? dto.getLendDate() : LocalDateTime.now());
        lending.setDueDate(dto.getDueDate());
        lending.setStatus(LendingStatus.BORROWED);

        BookLending savedLending = bookLendingRepository.save(lending);

        book.setStatus(BookStatus.BORROWED);
        bookRepository.save(book);

        return convertToDto(savedLending);
    }

    @Transactional
    public BookLendingDto returnBook(Long lendingId) {
        BookLending lending = bookLendingRepository.findById(lendingId)
                .orElseThrow(() -> new EntityNotFoundException("BookLending record not found with id: " + lendingId));

        if (!LendingStatus.BORROWED.equals(lending.getStatus())) {
            throw new IllegalStateException("Book is not in 'borrowed' status.");
        }

        lending.setReturnDate(LocalDateTime.now());
        lending.setStatus(LendingStatus.RETURNED);
        BookLending updatedLending = bookLendingRepository.save(lending);

        Book book = lending.getBook();
        book.setStatus(BookStatus.AVAILABLE);
        bookRepository.save(book);

        return convertToDto(updatedLending);
    }

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }
        User user = userRepository.findByUsername(username)
                .orElse(null); // Or throw if user must exist
        return user != null ? user.getId() : null;
    }

    private Long resolveUserId(String userIdStr, Long currentActualUserId) {
        if (userIdStr == null) return null;
        if ("current".equalsIgnoreCase(userIdStr)) {
            return currentActualUserId;
        }
        try {
            return Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            // Log error or handle invalid ID format
            throw new IllegalArgumentException("Invalid user ID format: " + userIdStr);
        }
    }

    private BookLendingDto convertToDto(BookLending lending) {
        BookLendingDto dto = new BookLendingDto();
        dto.setId(lending.getId());
        if (lending.getLender() != null) {
            dto.setLenderId(lending.getLender().getId());
            dto.setLenderName(lending.getLender().getDisplayName()); // Assuming User has getDisplayName
        }
        if (lending.getBorrower() != null) {
            dto.setBorrowerId(lending.getBorrower().getId());
            dto.setBorrowerName(lending.getBorrower().getDisplayName());
        }
        if (lending.getBook() != null) {
            dto.setBookId(lending.getBook().getId());
            dto.setBookTitle(lending.getBook().getTitle()); // Assuming Book has getTitle
            dto.setBookCoverImage(lending.getBook().getCoverImage());
        }
        dto.setLendDate(lending.getLendDate());
        dto.setDueDate(lending.getDueDate());
        dto.setReturnDate(lending.getReturnDate());
        dto.setStatus(lending.getStatus());
        return dto;
    }
} 