package com.familylibrary.controller;

import com.familylibrary.service.DataInitializationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DataInitializationController {

    private final DataInitializationService dataInitializationService;

    @PostMapping("/init-sample-data")
    public ResponseEntity<String> initializeSampleData() {
        try {
            dataInitializationService.initializeData();
            return ResponseEntity.ok("Sample data initialized successfully.");
        } catch (Exception e) {
            // Log the exception details
            System.err.println("Error during sample data initialization: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to initialize sample data: " + e.getMessage());
        }
    }
} 