package com.familylibrary.service;

import com.familylibrary.dto.BookDto;
import com.familylibrary.dto.CreateBookRequest;
import com.familylibrary.dto.ShelfPositionDto;
import com.familylibrary.dto.UserDto;
import com.familylibrary.model.*;
import com.familylibrary.repository.BookLendingRepository;
import com.familylibrary.repository.BookRepository;
import com.familylibrary.repository.BookshelfRepository;
import com.familylibrary.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final BookshelfRepository bookshelfRepository;
    private final BookLendingRepository bookLendingRepository;

    @Transactional(readOnly = true)
    public List<BookDto> getAllBooks(Long bookshelfId, String query, Integer limit, String sort) {
        if (bookshelfId != null) {
            List<Book> books = bookRepository.findByBookshelfId(bookshelfId);
            return books.stream().map(this::convertToBookDetailDto).collect(Collectors.toList());
        } else {
            List<Book> allBooks = bookRepository.findAll();
            return allBooks.stream().map(this::convertToBookDetailDto).collect(Collectors.toList());
        }
    }

    @Transactional(readOnly = true)
    public BookDto getBookById(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Book not found with id: " + id));
        return convertToBookDetailDto(book);
    }

    @Transactional
    public BookDto createBook(CreateBookRequest request) {
        // Validate ISBN
        if (request.getIsbn() == null || request.getIsbn().trim().isEmpty()) {
            throw new IllegalArgumentException("ISBN cannot be blank.");
        }
        if (bookRepository.existsByIsbn(request.getIsbn())) {
            throw new DataIntegrityViolationException("Book with ISBN " + request.getIsbn() + " already exists.");
        }

        Bookshelf bookshelf = bookshelfRepository.findById(request.getBookshelfId())
                .orElseThrow(() -> new EntityNotFoundException("Bookshelf not found with id: " + request.getBookshelfId()));

        User currentUser = getCurrentUser();

        Book book = new Book();
        book.setTitle(request.getTitle());
        book.setAuthor(request.getAuthor());
        book.setIsbn(request.getIsbn());
        book.setPublisher(request.getPublisher());
        book.setPublicationDate(request.getPublicationDate());
        book.setCategory(request.getGenre());
        book.setCoverImage(request.getCoverImageUrl());
        book.setCoverImageUrl(request.getCoverImageUrl());
        book.setDescription(request.getDescription());
        book.setBookshelf(bookshelf);
        book.setShelfNumber(request.getShelfNumber());
        book.setPositionNumber(request.getPositionOnShelf());
        book.setStatus(BookStatus.AVAILABLE);
        book.setAddedBy(currentUser);

        Book savedBook = bookRepository.save(book);
        return convertToBookDetailDto(savedBook);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal() == null) {
            throw new IllegalStateException("User is not authenticated or authentication details are not available.");
        }

        String username;
        Object principal = authentication.getPrincipal();

        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            username = (String) principal;
             if ("anonymousUser".equals(username)) {
                throw new IllegalStateException("Operation requires an authenticated user, but an anonymous user was found.");
            }
        } else {
            throw new IllegalStateException("Principal is not of expected type (UserDetails or String): " + principal.getClass().getName());
        }
        
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found with username: " + username));
    }

    private BookDto convertToDto(Book book) {
        if (book == null) return null;
        BookDto dto = new BookDto();
        dto.setId(book.getId());
        dto.setTitle(book.getTitle());
        dto.setAuthor(book.getAuthor());
        dto.setIsbn(book.getIsbn());
        dto.setGenre(book.getCategory());
        dto.setPublisher(book.getPublisher());
        dto.setPublicationDate(book.getPublicationDate());
        dto.setSummary(book.getDescription());
        dto.setCoverImageUrl(book.getCoverImageUrl() != null ? book.getCoverImageUrl() : book.getCoverImage());
        dto.setStatus(book.getStatus() != null ? book.getStatus().name() : null);
        
        Bookshelf bookshelf = book.getBookshelf();
        if (bookshelf != null) {
            dto.setBookshelfId(bookshelf.getId());
            dto.setBookshelfName(bookshelf.getName());
        }
        
        if (book.getShelfNumber() != null && book.getPositionNumber() != null) {
            dto.setShelfPosition(new ShelfPositionDto(book.getShelfNumber(), book.getPositionNumber()));
        } else {
            dto.setShelfPosition(null);
        }
        
        dto.setAddedDate(book.getCreatedAt());

        User addedByUser = book.getAddedBy();
        if (addedByUser != null) {
            UserDto addedByDto = new UserDto();
            addedByDto.setId(addedByUser.getId());
            addedByDto.setUsername(addedByUser.getUsername());
            addedByDto.setDisplayName(addedByUser.getDisplayName());
            dto.setAddedBy(addedByDto);
        }
        
        return dto;
    }

    private BookDto convertToBookDetailDto(Book book) {
        if (book == null) return null;
        BookDto dto = convertToDto(book);

        if (book.getStatus() == BookStatus.BORROWED) {
            List<BookLending> lendings = bookLendingRepository.findByBookAndStatus(book, LendingStatus.BORROWED);
            if (!lendings.isEmpty()) {
                BookLending currentLending = lendings.get(0);
                dto.setCurrentLendingId(currentLending.getId());
                if (currentLending.getBorrower() != null) {
                    UserDto borrowerDto = new UserDto();
                    borrowerDto.setId(currentLending.getBorrower().getId());
                    borrowerDto.setUsername(currentLending.getBorrower().getUsername());
                    borrowerDto.setDisplayName(currentLending.getBorrower().getDisplayName());
                    dto.setCurrentBorrower(borrowerDto);
                }
            }
        }
        return dto;
    }
} 