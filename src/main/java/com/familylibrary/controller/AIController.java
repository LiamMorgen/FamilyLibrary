package com.familylibrary.controller;

import com.familylibrary.dto.AIQueryDto;
import com.familylibrary.dto.DeepSeekMessageDto;
import com.familylibrary.dto.InitialAIAnalysisResponseDto;
import com.familylibrary.service.DeepSeekService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    private final DeepSeekService deepSeekService;

    @Autowired
    public AIController(DeepSeekService deepSeekService) {
        this.deepSeekService = deepSeekService;
    }

    @GetMapping("/initial-analysis")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<InitialAIAnalysisResponseDto> getInitialAnalysis() {
        InitialAIAnalysisResponseDto analysis = deepSeekService.getInitialAnalysisForCurrentUser();
        if (analysis == null) {
            // This might happen if the user is not found, or another issue occurs in the service
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
        return ResponseEntity.ok(analysis);
    }

    @PostMapping("/chat")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DeepSeekMessageDto> handleChatMessage(@RequestBody AIQueryDto queryDto) {
        if (queryDto == null || queryDto.getQuery() == null || queryDto.getQuery().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new DeepSeekMessageDto("assistant", "Your query is empty."));
        }
        DeepSeekMessageDto responseMessage = deepSeekService.getAIChatResponse(queryDto);
        return ResponseEntity.ok(responseMessage);
    }
} 