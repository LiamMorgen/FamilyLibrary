package com.familylibrary.dto;

import lombok.Data;
import java.util.Set;

@Data
public class FamilyDto {
    private Long id;
    private String name;
    private Set<Long> memberIds; // Or a more detailed UserInfoDto
    // private Integer memberCount; // Could be useful
} 