package com.familylibrary.repository;

import com.familylibrary.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email); // Assuming User has an email field
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);
} 