package com.familylibrary.controller;

import com.familylibrary.dto.CreateFamilyRequest;
import com.familylibrary.dto.FamilyDto;
import com.familylibrary.dto.UserDto;
import com.familylibrary.service.FamilyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/families")
@RequiredArgsConstructor
public class FamilyController {

    private final FamilyService familyService;

    @PostMapping
    public ResponseEntity<FamilyDto> createFamily(@Valid @RequestBody CreateFamilyRequest request) {
        FamilyDto createdFamily = familyService.createFamily(request);
        return new ResponseEntity<>(createdFamily, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FamilyDto> getFamilyById(@PathVariable Long id) {
        FamilyDto family = familyService.getFamilyById(id);
        return ResponseEntity.ok(family);
    }

    @GetMapping
    public ResponseEntity<List<FamilyDto>> getAllFamilies() {
        List<FamilyDto> families = familyService.getAllFamilies();
        return ResponseEntity.ok(families);
    }
    
    // Consider GET /api/families/by-name?name=familyName if needed

    @PostMapping("/{familyId}/members/{userId}")
    public ResponseEntity<FamilyDto> addMemberToFamily(@PathVariable Long familyId, @PathVariable Long userId) {
        FamilyDto updatedFamily = familyService.addMemberToFamily(familyId, userId);
        return ResponseEntity.ok(updatedFamily);
    }

    @DeleteMapping("/{familyId}/members/{userId}")
    public ResponseEntity<FamilyDto> removeMemberFromFamily(@PathVariable Long familyId, @PathVariable Long userId) {
        FamilyDto updatedFamily = familyService.removeMemberFromFamily(familyId, userId);
        return ResponseEntity.ok(updatedFamily);
    }

    @DeleteMapping("/{familyId}")
    public ResponseEntity<Void> deleteFamily(@PathVariable Long familyId) {
        familyService.deleteFamily(familyId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/current")
    public ResponseEntity<FamilyDto> getCurrentUserFamily() {
        // 这个方法需要从 SecurityContextHolder 获取当前认证的用户，
        // 然后查询该用户所属的家庭。
        FamilyDto family = familyService.getFamilyForCurrentUser(); // 假设有这样一个方法
        return ResponseEntity.ok(family);
    }

    @GetMapping("/current/users")
    public ResponseEntity<List<UserDto>> getCurrentFamilyMembers() {
        List<UserDto> users = familyService.getUsersForCurrentFamily();
        return ResponseEntity.ok(users);
    }
} 