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