package com.familylibrary.service;

import com.familylibrary.dto.BookshelfDto;
import com.familylibrary.dto.CreateBookshelfRequest;
import com.familylibrary.dto.UpdateBookshelfRequest;
import com.familylibrary.model.Book;
import com.familylibrary.model.Bookshelf;
import com.familylibrary.model.Family;
import com.familylibrary.model.User;
import com.familylibrary.repository.BookshelfRepository;
import com.familylibrary.repository.FamilyRepository;
import com.familylibrary.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookshelfService {

    private final BookshelfRepository bookshelfRepository;
    private final UserRepository userRepository;
    private final FamilyRepository familyRepository;

    @Transactional
    public BookshelfDto createBookshelf(CreateBookshelfRequest request) {
        if (request.getOwnerId() == null && request.getFamilyId() == null) {
            throw new IllegalArgumentException("A bookshelf must be associated with an owner (user) or a family.");
        }

        User owner = null;
        if (request.getOwnerId() != null) {
            owner = userRepository.findById(request.getOwnerId())
                    .orElseThrow(() -> new EntityNotFoundException("Owner (User) not found with id: " + request.getOwnerId()));
        }

        Family family = null;
        if (request.getFamilyId() != null) {
            family = familyRepository.findById(request.getFamilyId())
                    .orElseThrow(() -> new EntityNotFoundException("Family not found with id: " + request.getFamilyId()));
        }

        // Optional: Check if user is a member of the family if both are provided and that's a business rule
        // if (owner != null && family != null && !owner.getFamilies().contains(family)) {
        //     throw new IllegalArgumentException("Owner is not a member of the specified family.");
        // }

        Bookshelf bookshelf = new Bookshelf();
        bookshelf.setName(request.getName());
        bookshelf.setOwner(owner);
        bookshelf.setFamily(family);
        if (request.getNumShelves() != null) {
            bookshelf.setNumShelves(request.getNumShelves());
        }
        if (request.getIsPrivate() != null) {
            bookshelf.setPrivate(request.getIsPrivate());
        }
        // Defaults for numShelves and isPrivate are set in the entity itself

        Bookshelf savedBookshelf = bookshelfRepository.save(bookshelf);
        return convertToDto(savedBookshelf);
    }

    @Transactional(readOnly = true)
    public BookshelfDto getBookshelfById(Long id) {
        Bookshelf bookshelf = bookshelfRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Bookshelf not found with id: " + id));
        return convertToDto(bookshelf);
    }

    @Transactional(readOnly = true)
    public List<BookshelfDto> getBookshelvesByOwner(Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new EntityNotFoundException("Owner (User) not found with id: " + ownerId));
        return bookshelfRepository.findByOwner(owner).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookshelfDto> getBookshelvesByFamily(Long familyId) {
        Family family = familyRepository.findById(familyId)
                .orElseThrow(() -> new EntityNotFoundException("Family not found with id: " + familyId));
        // This will return all bookshelves in the family, respecting their private status at controller/client level if needed.
        return bookshelfRepository.findByFamily(family).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookshelfDto updateBookshelf(Long id, UpdateBookshelfRequest request) {
        Bookshelf bookshelf = bookshelfRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Bookshelf not found with id: " + id));

        // Add authorization check here: e.g., only owner can update

        if (request.getName() != null && !request.getName().isBlank()) {
            bookshelf.setName(request.getName());
        }
        if (request.getNumShelves() != null) {
            bookshelf.setNumShelves(request.getNumShelves());
        }
        if (request.getIsPrivate() != null) {
            bookshelf.setPrivate(request.getIsPrivate());
        }

        Bookshelf updatedBookshelf = bookshelfRepository.save(bookshelf);
        return convertToDto(updatedBookshelf);
    }

    @Transactional
    public void deleteBookshelf(Long id) {
        Bookshelf bookshelf = bookshelfRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Bookshelf not found with id: " + id));
        
        // Add authorization check here: e.g., only owner can delete
        
        // Business rule: cannot delete bookshelf if it contains books
        if (!bookshelf.getBooks().isEmpty()) {
            throw new IllegalStateException("Cannot delete bookshelf with id " + id + " as it still contains books.");
        }
        bookshelfRepository.deleteById(id);
    }

    private BookshelfDto convertToDto(Bookshelf bookshelf) {
        BookshelfDto dto = new BookshelfDto();
        dto.setId(bookshelf.getId());
        dto.setName(bookshelf.getName());

        if (bookshelf.getOwner() != null) {
            dto.setOwnerId(bookshelf.getOwner().getId());
            dto.setOwnerUsername(bookshelf.getOwner().getDisplayName()); // Prefer displayName
        } else {
            dto.setOwnerId(null);
            dto.setOwnerUsername(null);
        }

        if (bookshelf.getFamily() != null) {
            dto.setFamilyId(bookshelf.getFamily().getId());
            dto.setFamilyName(bookshelf.getFamily().getName());
        } else {
            dto.setFamilyId(null);
            dto.setFamilyName(null);
        }

        dto.setNumShelves(bookshelf.getNumShelves());
        dto.setPrivate(bookshelf.isPrivate());
        dto.setBookIds(bookshelf.getBooks().stream().map(Book::getId).collect(Collectors.toList()));
        dto.setCreatedAt(bookshelf.getCreatedAt());
        dto.setUpdatedAt(bookshelf.getUpdatedAt());
        return dto;
    }

    public List<BookshelfDto> getAllVisibleBookshelvesForCurrentUser() {
        // TODO: 在这里实现获取当前登录用户有权访问的所有书架的逻辑。
        // 这可能涉及到:
        // 1. 从 Spring Security 上下文中获取当前认证的用户。
        // 2. 根据用户的ID、所属家庭的ID，或者书架的公共/私有状态等条件来查询数据库。
        // 3. 将查询结果转换为 BookshelfDto 列表。

        // 作为一个临时的占位符，我们返回一个空列表。
        // 你可以添加一些日志来确认此方法是否被调用。
        System.out.println("DEBUG: BookshelfService.getAllVisibleBookshelvesForCurrentUser() called - placeholder implementation. Returning empty list.");
        return new ArrayList<>();
    }
} 