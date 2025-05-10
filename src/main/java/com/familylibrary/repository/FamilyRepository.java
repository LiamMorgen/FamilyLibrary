package com.familylibrary.repository;

import com.familylibrary.model.Family;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FamilyRepository extends JpaRepository<Family, Long> {
    Optional<Family> findByName(String name);
    Boolean existsByName(String name);
} 