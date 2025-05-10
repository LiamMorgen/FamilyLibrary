package com.familylibrary.service;

import com.familylibrary.dto.BookDto;
import com.familylibrary.dto.UserDto; // Required for BookDto.addedBy
import com.familylibrary.model.Book; // Assuming Book entity exists
import com.familylibrary.model.Bookshelf;
import com.familylibrary.model.User; // Required for converting User to UserDto
import com.familylibrary.repository.BookRepository; // Assuming BookRepository exists
import com.familylibrary.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository; // Will be needed for actual implementation
    private final UserRepository userRepository; // For fetching user details for addedBy field

    @Transactional(readOnly = true)
    public List<BookDto> getAllBooks(Long bookshelfId, String query, Integer limit, String sort) {
        // TODO: Implement actual logic to fetch books based on parameters
        // For now, returning an empty list.
        System.out.println("DEBUG: BookService.getAllBooks called with bookshelfId: " + bookshelfId + ", query: " + query + ", limit: " + limit + ", sort: " + sort + " - placeholder implementation. Returning empty list.");
        
        // Example of how you might fetch and convert if you had data:
        // List<Book> books = bookRepository.findAll(); // Replace with actual query logic
        // return books.stream().map(this::convertToDto).collect(Collectors.toList());

        return Collections.emptyList();
    }

    @Transactional(readOnly = true)
    public BookDto getBookById(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Book not found with id: " + id));
        return convertToDto(book);
    }

    // TODO: Implement createBook, updateBook, deleteBook methods

    // Helper method to convert Book entity to BookDto
    // This needs to be implemented based on your Book entity structure
    private BookDto convertToDto(Book book) {
        if (book == null) return null;
        BookDto dto = new BookDto();
        dto.setId(book.getId());
        dto.setTitle(book.getTitle());
        dto.setAuthor(book.getAuthor());
        dto.setIsbn(book.getIsbn());
        dto.setGenre(book.getCategory());
        dto.setSummary(book.getDescription());
        dto.setCoverImageUrl(book.getCoverImage());
        dto.setStatus(book.getStatus() != null ? book.getStatus().name() : null);
        
        Bookshelf bookshelf = book.getBookshelf();
        if (bookshelf != null) {
            dto.setBookshelfId(bookshelf.getId());
            dto.setBookshelfName(bookshelf.getName());
        }
        
        dto.setAddedDate(book.getCreatedAt());
        // dto.setTotalPages(book.getTotalPages()); // TotalPages field does not exist in Book entity - COMMENTED OUT
        // dto.setLanguage(book.getLanguage()); // Language field does not exist in Book entity - COMMENTED OUT

        User addedByUser = book.getAddedBy();
        if (addedByUser != null) {
            UserDto addedByDto = new UserDto();
            addedByDto.setId(addedByUser.getId());
            addedByDto.setUsername(addedByUser.getUsername());
            addedByDto.setDisplayName(addedByUser.getDisplayName());
            // Fill other UserDto fields as needed, but NOT password
            dto.setAddedBy(addedByDto);
        }
        return dto;
    }
} 