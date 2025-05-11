package com.familylibrary.dto;

import lombok.Data;
import java.util.List;

@Data
public class DeepSeekChatResponseDto {
    private String id;
    private String object;
    private long created;
    private String model;
    private List<DeepSeekChoiceDto> choices;
    private UsageDto usage;

    @Data
    public static class UsageDto { // Inner class for usage details
        private int prompt_tokens;
        private int completion_tokens;
        private int total_tokens;
    }
} 