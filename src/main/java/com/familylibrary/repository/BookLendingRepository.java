package com.familylibrary.repository;

import com.familylibrary.model.Book;
import com.familylibrary.model.BookLending;
import com.familylibrary.model.LendingStatus;
import com.familylibrary.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookLendingRepository extends JpaRepository<BookLending, Long> {

    List<BookLending> findByBook(Book book);

    List<BookLending> findByLenderOrderByLendDateDesc(User lender);

    List<BookLending> findByBorrowerOrderByLendDateDesc(User borrower);

    List<BookLending> findByStatus(LendingStatus status);

    List<BookLending> findByBookAndStatus(Book book, LendingStatus status);
    
    Optional<BookLending> findByBookAndBorrowerAndStatus(Book book, User borrower, LendingStatus status);

    // Find overdue books (due date is in the past and status is BORROWED)
    @Query("SELECT bl FROM BookLending bl WHERE bl.status = :status AND bl.dueDate < :now")
    List<BookLending> findOverdueLendings(@Param("status") LendingStatus status, @Param("now") LocalDateTime now);

    // Check if a book is currently borrowed by anyone
    boolean existsByBookAndStatus(Book book, LendingStatus status);
}
 