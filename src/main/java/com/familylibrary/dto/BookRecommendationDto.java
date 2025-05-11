package com.familylibrary.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookRecommendationDto {
    private String title;
    private String author;
    private String reason; // Recommendation reason from AI
    private String coverImageUrl; // Optional, if AI can provide or we can find one
    private String isbn; // Optional
} 