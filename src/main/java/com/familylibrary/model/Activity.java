package com.familylibrary.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "activities")
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "activity_type", nullable = false)
    private String activityType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id") // Nullable as per schema
    private Book book;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_user_id") // Nullable as per schema
    private User relatedUser;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @JdbcTypeCode(SqlTypes.JSON) // Recommended way for Hibernate 6+
    @Column(columnDefinition = "jsonb") // Ensures PostgreSQL uses jsonb
    private String data; // Stores JSON as String, can be parsed as needed

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
} 