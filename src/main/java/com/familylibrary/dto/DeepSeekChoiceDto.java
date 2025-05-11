package com.familylibrary.dto;

import lombok.Data;

@Data
public class DeepSeekChoiceDto {
    private int index;
    private DeepSeekMessageDto message;
    private String finish_reason;
} 