package com.familylibrary.dto;

import lombok.Data;
import java.util.List;

@Data
public class AIQueryDto {
    private String query; // User's current message
    private List<DeepSeekMessageDto> history; // Optional chat history
} 