package com.familylibrary.dto;

import lombok.Data;
import java.util.List;

@Data
public class DeepSeekChatRequestDto {
    private String model;
    private List<DeepSeekMessageDto> messages;
    private boolean stream = false; // Default to false, can be configured
    private int max_tokens = 2048; // Default value
    private double temperature = 0.7; // Default value
    // Add other parameters like top_p, frequency_penalty, presence_penalty if needed
} 