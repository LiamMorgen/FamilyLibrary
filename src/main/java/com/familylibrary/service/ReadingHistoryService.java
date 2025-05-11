package com.familylibrary.service;

import com.familylibrary.dto.CreateReadingHistoryRequest;
import com.familylibrary.dto.ReadingHistoryDto;
import com.familylibrary.dto.UpdateReadingHistoryRequest;
import com.familylibrary.model.Book;
import com.familylibrary.model.ReadingHistory;
import com.familylibrary.model.User;
import com.familylibrary.repository.BookRepository;
import com.familylibrary.repository.ReadingHistoryRepository;
import com.familylibrary.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReadingHistoryService {

    private final ReadingHistoryRepository readingHistoryRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository; // Assuming BookRepository exists

    @Transactional
    public ReadingHistoryDto createReadingHistory(CreateReadingHistoryRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + request.getUserId()));
        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new EntityNotFoundException("Book not found with id: " + request.getBookId()));

        ReadingHistory readingHistory = new ReadingHistory();
        readingHistory.setUser(user);
        readingHistory.setBook(book);
        if (request.getStartDate() != null) {
            readingHistory.setStartDate(request.getStartDate());
        }
        // endDate, rating, notes are optional at creation and can be set via update
        readingHistory.setEndDate(request.getEndDate());
        readingHistory.setRating(request.getRating());
        readingHistory.setNotes(request.getNotes());

        ReadingHistory savedHistory = readingHistoryRepository.save(readingHistory);
        return convertToDto(savedHistory);
    }

    @Transactional(readOnly = true)
    public List<ReadingHistoryDto> getReadingHistoryForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
        return readingHistoryRepository.findByUserOrderByStartDateDesc(user)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReadingHistoryDto getReadingHistoryById(Long id) {
        ReadingHistory readingHistory = readingHistoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Reading history not found with id: " + id));
        return convertToDto(readingHistory);
    }

    @Transactional
    public ReadingHistoryDto updateReadingHistory(Long id, UpdateReadingHistoryRequest request) {
        ReadingHistory readingHistory = readingHistoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Reading history not found with id: " + id));

        if (request.getStartDate() != null) {
            readingHistory.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            readingHistory.setEndDate(request.getEndDate());
        }
        if (request.getRating() != null) {
            readingHistory.setRating(request.getRating());
        }
        if (request.getNotes() != null) {
            readingHistory.setNotes(request.getNotes());
        }

        ReadingHistory updatedHistory = readingHistoryRepository.save(readingHistory);
        return convertToDto(updatedHistory);
    }

    @Transactional
    public void deleteReadingHistory(Long id) {
        if (!readingHistoryRepository.existsById(id)) {
            throw new EntityNotFoundException("Reading history not found with id: " + id);
        }
        readingHistoryRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<ReadingHistoryDto> getReadingHistory(String userIdStr, Long bookId, Long familyId) {
        // TODO: Implement logic to resolve 'current' userId to actual Long userId
        // For now, we'll assume userIdStr can be parsed to Long or is null.
        // Also, familyId filtering is not yet implemented based on current ReadingHistory entity.

        Long actualUserId = null;
        if (userIdStr != null && !userIdStr.equalsIgnoreCase("current")) {
            try {
                actualUserId = Long.parseLong(userIdStr);
            } catch (NumberFormatException e) {
                // Handle error or throw custom exception if userIdStr is not 'current' and not a valid Long
                throw new IllegalArgumentException("Invalid userId format: " + userIdStr);
            }
        } else if (userIdStr != null && userIdStr.equalsIgnoreCase("current")) {
            // Here you would typically get the current user's ID from Spring Security Context
            // For now, let's throw an exception or return empty if not implemented
            //throw new UnsupportedOperationException("Resolving 'current' user ID is not yet implemented in service layer.");
            // Or, for testing, assume a default user or handle in controller
            // For now, if 'current', let it pass as null to the repository to fetch all if other params are null.
            // This behavior should be refined.
        }

        // Example: Basic filtering by userId and bookId if they are provided
        // This needs to be adapted to use ReadingHistoryRepository methods
        // For a more complex query (e.g. involving familyId through book's bookshelf), 
        // a custom query in the repository or Specification API would be needed.

        if (actualUserId != null && bookId != null) {
            final Long finalActualUserId = actualUserId; // Create a final variable for lambda
            User user = userRepository.findById(finalActualUserId)
                    .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + finalActualUserId));
            Book book = bookRepository.findById(bookId)
                    .orElseThrow(() -> new EntityNotFoundException("Book not found with id: " + bookId));
            return readingHistoryRepository.findByUserAndBookOrderByStartDateDesc(user, book)
                    .stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
        } else if (actualUserId != null) {
            final Long finalActualUserIdForElse = actualUserId; // Create a final variable for lambda
            User user = userRepository.findById(finalActualUserIdForElse)
                    .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + finalActualUserIdForElse));
            return readingHistoryRepository.findByUserOrderByStartDateDesc(user)
                    .stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
        } else if (bookId != null) {
            Book book = bookRepository.findById(bookId)
                    .orElseThrow(() -> new EntityNotFoundException("Book not found with id: " + bookId));
            // Assuming you might want to find history for a book across all users
            return readingHistoryRepository.findByBookOrderByStartDateDesc(book)
                    .stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
        }
        // If no specific filters are strongly applicable, or if 'current' user logic needs to fetch all for that user
        // For now, returning all reading history - THIS SHOULD BE REFINED for security and performance
        return readingHistoryRepository.findAll()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private ReadingHistoryDto convertToDto(ReadingHistory readingHistory) {
        ReadingHistoryDto dto = new ReadingHistoryDto();
        dto.setId(readingHistory.getId());
        dto.setUserId(readingHistory.getUser().getId());
        dto.setUsername(readingHistory.getUser().getUsername()); // Or displayName
        dto.setBookId(readingHistory.getBook().getId());
        dto.setBookTitle(readingHistory.getBook().getTitle());
        dto.setStartDate(readingHistory.getStartDate());
        dto.setEndDate(readingHistory.getEndDate());
        dto.setRating(readingHistory.getRating());
        dto.setNotes(readingHistory.getNotes());
        return dto;
    }
} 