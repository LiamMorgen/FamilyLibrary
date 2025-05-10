package com.familylibrary.controller;

import com.familylibrary.dto.CreateReadingHistoryRequest;
import com.familylibrary.dto.ReadingHistoryDto;
import com.familylibrary.dto.UpdateReadingHistoryRequest;
import com.familylibrary.service.ReadingHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reading-history")
@RequiredArgsConstructor
public class ReadingHistoryController {

    private final ReadingHistoryService readingHistoryService;

    @PostMapping
    public ResponseEntity<ReadingHistoryDto> createReadingHistory(@Valid @RequestBody CreateReadingHistoryRequest request) {
        ReadingHistoryDto createdHistory = readingHistoryService.createReadingHistory(request);
        return new ResponseEntity<>(createdHistory, HttpStatus.CREATED);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReadingHistoryDto>> getReadingHistoryForUser(@PathVariable Long userId) {
        List<ReadingHistoryDto> historyList = readingHistoryService.getReadingHistoryForUser(userId);
        return ResponseEntity.ok(historyList);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReadingHistoryDto> getReadingHistoryById(@PathVariable Long id) {
        ReadingHistoryDto history = readingHistoryService.getReadingHistoryById(id);
        return ResponseEntity.ok(history);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReadingHistoryDto> updateReadingHistory(@PathVariable Long id, @Valid @RequestBody UpdateReadingHistoryRequest request) {
        ReadingHistoryDto updatedHistory = readingHistoryService.updateReadingHistory(id, request);
        return ResponseEntity.ok(updatedHistory);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReadingHistory(@PathVariable Long id) {
        readingHistoryService.deleteReadingHistory(id);
        return ResponseEntity.noContent().build();
    }
} 