package com.familylibrary.service;

import com.familylibrary.dto.FamilyDto;
import com.familylibrary.dto.CreateFamilyRequest;
import com.familylibrary.model.Family;
import com.familylibrary.model.User;
import com.familylibrary.repository.FamilyRepository;
import com.familylibrary.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        Family savedFamily = familyRepository.save(family);
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
        
        // Before deleting a family, ensure all members are disassociated to avoid constraint violations
        // Or handle this with cascading deletes if appropriate (careful with ManyToMany)
        if (!family.getMembers().isEmpty()) {
            // Option 1: Disassociate members
            // family.getMembers().forEach(member -> member.getFamilies().remove(family));
            // userRepository.saveAll(family.getMembers());
            // family.getMembers().clear();
            // familyRepository.save(family); 
            // Option 2: Throw error if family is not empty
             throw new DataIntegrityViolationException("Cannot delete family with id " + familyId + " as it still has members. Please remove members first.");
        }
        
        familyRepository.deleteById(familyId);
    }

    public FamilyDto getFamilyForCurrentUser() {
        // TODO: Implement logic to get the family for the current authenticated user.
        // This would typically involve:
        // 1. Getting the current authenticated user from Spring Security context.
        // 2. Finding the family associated with this user (e.g., user.getFamilies() if a user can belong to multiple, or a direct family_id foreign key).
        // 3. If a user can be in multiple families, you might need a concept of a "current" or "primary" family, or return a list.
        // 4. For now, assuming a user belongs to one primary family or you want to return the first one found.
        // 5. Converting to FamilyDto.

        System.out.println("DEBUG: FamilyService.getFamilyForCurrentUser() called - placeholder implementation. Returning null.");
        return null; // Placeholder - you'll likely want to throw an exception or return an Optional if no family is found.
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
} 