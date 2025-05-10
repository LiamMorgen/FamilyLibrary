package com.familylibrary.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String username;
    private String displayName;
    private String email;
    private String avatar;
    private boolean isOnline; // Changed from isOnline to isOnline to match typical boolean naming
    // Add any other fields you want to expose about the user
    // IMPORTANT: Do NOT include password or other sensitive information here.
} 