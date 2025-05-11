package com.familylibrary.service;

import com.familylibrary.model.User;

public interface UserService {
    User getCurrentUser();
    User findById(Long userId);
    User findByUsername(String username);
    // Add other user-related service methods if needed
} 