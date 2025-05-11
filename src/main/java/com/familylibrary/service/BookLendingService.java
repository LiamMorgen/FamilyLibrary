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
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookLendingService {

    private final BookLendingRepository bookLendingRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<BookLendingDto> getBookLendings(String lenderIdStr, String borrowerIdStr, Long bookId) {
        User currentUser = userService.getCurrentUser();
        Long currentActualUserId = (currentUser != null) ? currentUser.getId() : null;
        
        Long lenderId = resolveUserId(lenderIdStr, currentActualUserId);
        Long borrowerId = resolveUserId(borrowerIdStr, currentActualUserId);

        // TODO: Implement sophisticated filtering in repository based on combinations of these IDs
        // For now, a simple approach:
        if (lenderId != null) {
            User lender = userService.findById(lenderId);
            if (lender == null) throw new EntityNotFoundException("Lender not found");
            return bookLendingRepository.findByLender(lender).stream().map(this::convertToDtoWithDetails).collect(Collectors.toList());
        }
        if (borrowerId != null) {
            User borrower = userService.findById(borrowerId);
            if (borrower == null) throw new EntityNotFoundException("Borrower not found");
            return bookLendingRepository.findByBorrower(borrower).stream().map(this::convertToDtoWithDetails).collect(Collectors.toList());
        }
        if (bookId != null) {
            Book book = bookRepository.findById(bookId).orElseThrow(() -> new EntityNotFoundException("Book not found"));
            return bookLendingRepository.findByBook(book).stream().map(this::convertToDtoWithDetails).collect(Collectors.toList());
        }
        return bookLendingRepository.findAll().stream().map(this::convertToDtoWithDetails).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookLendingDto> getMyActiveLendings() {
        User currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            return Collections.emptyList(); // Or throw an exception if user must be authenticated
        }
        List<BookLending> lendings = bookLendingRepository.findByBorrowerAndStatus(currentUser, LendingStatus.BORROWED);
        return lendings.stream().map(this::convertToDtoWithDetails).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long countMyActiveLendings() {
        User currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            return 0;
        }
        return bookLendingRepository.countByBorrowerAndStatus(currentUser, LendingStatus.BORROWED);
    }

    @Transactional(readOnly = true)
    public long countTotalLendingsForCurrentUser() {
        User currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            return 0;
        }
        return bookLendingRepository.countByBorrower(currentUser);
    }

    @Transactional
    public BookLendingDto createBookLending(BookLendingDto dto) {
        User lender = userService.findById(dto.getLenderId());
        if (lender == null) throw new EntityNotFoundException("Lender not found with id: " + dto.getLenderId());
        
        User borrower = userService.findById(dto.getBorrowerId());
        if (borrower == null) throw new EntityNotFoundException("Borrower not found with id: " + dto.getBorrowerId());

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

        return convertToDtoWithDetails(savedLending);
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

        return convertToDtoWithDetails(updatedLending);
    }

    private Long resolveUserId(String userIdStr, Long currentActualUserId) {
        if (userIdStr == null || userIdStr.trim().isEmpty()) return null;
        if ("current".equalsIgnoreCase(userIdStr.trim())) {
            if (currentActualUserId == null) {
                throw new IllegalStateException("Cannot resolve 'current' user ID without an authenticated user.");
            }
            return currentActualUserId;
        }
        try {
            return Long.parseLong(userIdStr.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid user ID format: " + userIdStr);
        }
    }

    private BookLendingDto convertToDtoWithDetails(BookLending lending) {
        BookLendingDto dto = new BookLendingDto();
        dto.setId(lending.getId());
        if (lending.getLender() != null) {
            dto.setLenderId(lending.getLender().getId());
            dto.setLenderName(lending.getLender().getDisplayName());
        }
        if (lending.getBorrower() != null) {
            dto.setBorrowerId(lending.getBorrower().getId());
            dto.setBorrowerName(lending.getBorrower().getDisplayName());
        }
        if (lending.getBook() != null) {
            dto.setBookId(lending.getBook().getId());
            dto.setBookTitle(lending.getBook().getTitle());
            dto.setBookCoverImage(lending.getBook().getCoverImage() != null ? lending.getBook().getCoverImage() : lending.getBook().getCoverImageUrl());
        }
        dto.setLendDate(lending.getLendDate());
        dto.setDueDate(lending.getDueDate());
        dto.setReturnDate(lending.getReturnDate());
        dto.setStatus(lending.getStatus());
        return dto;
    }
} 