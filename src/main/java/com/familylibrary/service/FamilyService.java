package com.familylibrary.service;

import com.familylibrary.dto.FamilyDto;
import com.familylibrary.dto.CreateFamilyRequest;
import com.familylibrary.dto.UserDto;
import com.familylibrary.model.Family;
import com.familylibrary.model.User;
import com.familylibrary.repository.FamilyRepository;
import com.familylibrary.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FamilyService {

    private final FamilyRepository familyRepository;
    private final UserRepository userRepository;

    @Transactional
    public FamilyDto createFamily(CreateFamilyRequest request) {
        if (familyRepository.existsByName(request.getName())) {
            throw new DataIntegrityViolationException("Family with name '" + request.getName() + "' already exists.");
        }
        Family family = new Family();
        family.setName(request.getName());

        // Get current user
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails)principal).getUsername();
        } else {
            username = principal.toString();
        }
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("Current user not found: " + username + " when trying to create family."));

        // Add current user as a member
        family.getMembers().add(currentUser);
        // Also update the user's side of the relationship
        currentUser.getFamilies().add(family);
        // Note: JPA/Hibernate should handle the join table update due to the @ManyToMany relationship owned by User.
        // However, explicitly saving the user after modification is a good practice to ensure changes are persisted.

        Family savedFamily = familyRepository.save(family); // Save family first, which might generate ID
        userRepository.save(currentUser); // Then save user with the new family association

        return convertToDto(savedFamily);
    }

    @Transactional(readOnly = true)
    public FamilyDto getFamilyById(Long id) {
        Family family = familyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Family not found with id: " + id));
        return convertToDto(family);
    }

    @Transactional(readOnly = true)
    public FamilyDto getFamilyByName(String name) {
        Family family = familyRepository.findByName(name)
                .orElseThrow(() -> new EntityNotFoundException("Family not found with name: " + name));
        return convertToDto(family);
    }

    @Transactional(readOnly = true)
    public List<FamilyDto> getAllFamilies() {
        return familyRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public FamilyDto addMemberToFamily(Long familyId, Long userId) {
        Family family = familyRepository.findById(familyId)
                .orElseThrow(() -> new EntityNotFoundException("Family not found with id: " + familyId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        // User entity manages the relationship, so add family to user's set of families
        user.getFamilies().add(family);
        // And add user to family's set of members (for consistency, though User is owning side)
        family.getMembers().add(user);
        
        userRepository.save(user); // This should cascade and update the join table
        // familyRepository.save(family); // Not strictly necessary if User is owning side and cascades correctly
        return convertToDto(familyRepository.findById(familyId).orElseThrow()); // Re-fetch to get updated state
    }

    @Transactional
    public FamilyDto removeMemberFromFamily(Long familyId, Long userId) {
        Family family = familyRepository.findById(familyId)
                .orElseThrow(() -> new EntityNotFoundException("Family not found with id: " + familyId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        user.getFamilies().remove(family);
        family.getMembers().remove(user);

        userRepository.save(user);
        return convertToDto(familyRepository.findById(familyId).orElseThrow());
    }
    
    @Transactional
    public void deleteFamily(Long familyId) {
        Family family = familyRepository.findById(familyId)
            .orElseThrow(() -> new EntityNotFoundException("Family not found with id: " + familyId));
        
        if (!family.getMembers().isEmpty()) {
             throw new DataIntegrityViolationException("Cannot delete family with id " + familyId + " as it still has members. Please remove members first.");
        }
        
        familyRepository.deleteById(familyId);
    }

    @Transactional(readOnly = true)
    public FamilyDto getFamilyForCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails)principal).getUsername();
        } else {
            username = principal.toString();
        }

        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("Current user not found: " + username));

        // Assuming a user belongs to one primary family or we take the first one.
        // This logic might need refinement based on your exact requirements (e.g., if a user can be in multiple families)
        if (currentUser.getFamilies() != null && !currentUser.getFamilies().isEmpty()) {
            Family currentFamily = currentUser.getFamilies().iterator().next(); // Get the first family
            return convertToDto(currentFamily);
        }
        return null; // Or throw an exception if a user is expected to always have a family
    }

    @Transactional(readOnly = true)
    public List<UserDto> getUsersForCurrentFamily() {
        FamilyDto currentFamilyDto = getFamilyForCurrentUser();
        if (currentFamilyDto == null) {
            // Handle case where current user has no family or family couldn't be determined
            return Collections.emptyList(); 
        }

        Family currentFamily = familyRepository.findById(currentFamilyDto.getId())
                .orElseThrow(() -> new EntityNotFoundException("Family not found with id: " + currentFamilyDto.getId()));

        return currentFamily.getMembers().stream()
                .map(this::convertToUserDto)
                .collect(Collectors.toList());
    }

    private FamilyDto convertToDto(Family family) {
        FamilyDto dto = new FamilyDto();
        dto.setId(family.getId());
        dto.setName(family.getName());
        if (family.getMembers() != null) {
            dto.setMemberIds(family.getMembers().stream().map(User::getId).collect(Collectors.toSet()));
        }
        return dto;
    }

    private UserDto convertToUserDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setDisplayName(user.getDisplayName());
        dto.setEmail(user.getEmail());
        dto.setAvatar(user.getAvatar());
        // dto.setIsOnline(user.getIsOnline()); // Assuming isOnline is a field in User model and UserDto
        // Add other necessary fields from User to UserDto
        return dto;
    }
} 