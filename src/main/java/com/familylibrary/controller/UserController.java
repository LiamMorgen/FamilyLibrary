package com.familylibrary.controller;

import com.familylibrary.dto.FamilySimpleDto;
import com.familylibrary.dto.UserDto; // Assuming UserDto exists
import com.familylibrary.model.Family;
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

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

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

        UserDto responseUser = convertUserToDto(user);

        return ResponseEntity.ok(responseUser);
    }

    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<UserDto> userDtos = users.stream()
                                      .map(this::convertUserToDto)
                                      .collect(Collectors.toList());
        return ResponseEntity.ok(userDtos);
    }

    private UserDto convertUserToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setDisplayName(user.getDisplayName());
        dto.setEmail(user.getEmail());
        dto.setAvatar(user.getAvatar());
        dto.setOnline(user.isOnline());

        if (user.getFamilies() != null) {
            Set<FamilySimpleDto> familyDtos = user.getFamilies().stream()
                    .map(family -> new FamilySimpleDto(family.getId(), family.getName()))
                    .collect(Collectors.toSet());
            dto.setFamilies(familyDtos);
        } else {
            dto.setFamilies(java.util.Collections.emptySet());
        }
        return dto;
    }

    // TODO: Add GET /api/users for listing all users (admin functionality)
    // TODO: Add GET /api/users/{id} for specific user (admin/profile functionality)
} 