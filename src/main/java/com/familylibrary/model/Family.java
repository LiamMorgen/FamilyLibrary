package com.familylibrary.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.util.HashSet;
import java.util.Set;

@Data
@Entity
@Table(name = "families")
public class Family {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true) // Assuming family names should be unique
    private String name;

    @ManyToMany(mappedBy = "families", fetch = FetchType.LAZY)
    @EqualsAndHashCode.Exclude // Avoid circular dependency issues with lombok
    @ToString.Exclude // Avoid circular dependency issues with lombok
    private Set<User> members = new HashSet<>();

    // Consider adding createdAt and updatedAt timestamps if needed
} 