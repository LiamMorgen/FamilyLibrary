package com.familylibrary.dto;

import lombok.Data;
import java.util.List;

@Data
public class InitialAIAnalysisResponseDto {
    private String analysisText; // Full text analysis from AI
    private List<BookRecommendationDto> recommendedBooks; // Structured recommendations if parsable
} 