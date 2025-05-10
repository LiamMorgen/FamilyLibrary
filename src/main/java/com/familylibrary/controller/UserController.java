package com.familylibrary.controller;

import com.familylibrary.dto.UserDto; // Assuming UserDto exists
import com.familylibrary.model.User;
import com.familylibrary.repository.UserRepository;
// import com.familylibrary.service.UserService; // Assuming UserService exists for mapping or richer logic - REMOVED
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository; 
    // private final UserService userService; // Optional: for more complex logic or DTO mapping - REMOVED

    @GetMapping("/current")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body("User not authenticated");
        }

        Object principal = authentication.getPrincipal();
        String username;

        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }

        User user = userRepository.findByUsername(username)
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(404).body("User not found in repository");
        }

        // TODO: Convert User to UserDto to avoid exposing sensitive data like password
        // For now, returning the User object directly (or a simplified map)
        // UserDto userDto = userService.convertToDto(user); 
        // return ResponseEntity.ok(userDto);

        // Simplified response for now:
        UserDto responseUser = new UserDto();
        responseUser.setId(user.getId());
        responseUser.setUsername(user.getUsername());
        responseUser.setDisplayName(user.getDisplayName());
        responseUser.setEmail(user.getEmail());
        responseUser.setAvatar(user.getAvatar());
        responseUser.setOnline(user.isOnline());
        // DO NOT include password or other sensitive fields

        return ResponseEntity.ok(responseUser);
    }

    // TODO: Add GET /api/users for listing all users (admin functionality)
    // TODO: Add GET /api/users/{id} for specific user (admin/profile functionality)
} 