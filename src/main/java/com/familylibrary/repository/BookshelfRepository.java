package com.familylibrary.repository;

import com.familylibrary.model.Bookshelf;
import com.familylibrary.model.Family;
import com.familylibrary.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookshelfRepository extends JpaRepository<Bookshelf, Long> {

    List<Bookshelf> findByOwner(User owner);

    List<Bookshelf> findByFamily(Family family);

    List<Bookshelf> findByOwnerAndFamily(User owner, Family family);

    Optional<Bookshelf> findByIdAndOwner(Long id, User owner);

    // Find by name within a specific family or by a specific owner
    Optional<Bookshelf> findByNameAndOwner(String name, User owner);
    Optional<Bookshelf> findByNameAndFamily(String name, Family family);

} 