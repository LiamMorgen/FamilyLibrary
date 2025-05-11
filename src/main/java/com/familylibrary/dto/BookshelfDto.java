package com.familylibrary.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
public class BookshelfDto {
    private Long id;
    private String name;
    private Long ownerId;
    private String ownerUsername; // Convenience
    private Long familyId;
    private String familyName; // Convenience
    private Integer numShelves;
    private boolean isPrivate;
    private Map<Integer, String> shelfNames; // Key: 1-based shelf index, Value: shelf name
    private List<Long> bookIds; // Or BookDto list, can be large
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 