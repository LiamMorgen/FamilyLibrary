package com.familylibrary.controller;

import com.familylibrary.service.BookScanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/books")
public class BookScanController {

    @Autowired
    private BookScanService bookScanService;

    @PostMapping("/scan")
    public ResponseEntity<?> scanBook(@RequestParam("image") MultipartFile image) {
        try {
            Map<String, Object> bookInfo = bookScanService.scanBook(image);
            return ResponseEntity.ok(bookInfo);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Failed to process image: " + e.getMessage());
        }
    }
} 