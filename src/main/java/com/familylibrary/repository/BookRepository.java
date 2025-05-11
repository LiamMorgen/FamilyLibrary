package com.familylibrary.repository;

import com.familylibrary.model.Book;
import com.familylibrary.model.Bookshelf;
import com.familylibrary.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    Optional<Book> findByIsbn(String isbn);

    List<Book> findByTitleContainingIgnoreCase(String titleKeyword);

    List<Book> findByAuthorContainingIgnoreCase(String authorKeyword);

    List<Book> findByCategoryIgnoreCase(String category);

    List<Book> findByBookshelf(Bookshelf bookshelf);

    List<Book> findByBookshelfId(Long bookshelfId);

    List<Book> findByAddedBy(User user);

    // Example of a more complex query to find books by title in a specific user's bookshelves
    @Query("SELECT b FROM Book b WHERE b.bookshelf.owner = :user AND lower(b.title) LIKE lower(concat('%', :titleKeyword, '%'))")
    List<Book> findByUserAndTitleContainingIgnoreCase(@Param("user") User user, @Param("titleKeyword") String titleKeyword);

    boolean existsByIsbn(String isbn);

} 