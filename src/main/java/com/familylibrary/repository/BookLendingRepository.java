package com.familylibrary.repository;

import com.familylibrary.model.Book;
import com.familylibrary.model.BookLending;
import com.familylibrary.model.User;
import com.familylibrary.model.LendingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookLendingRepository extends JpaRepository<BookLending, Long> {

    List<BookLending> findByLender(User lender);

    List<BookLending> findByBorrower(User borrower);

    List<BookLending> findByBook(Book book);

    // Methods to get active lendings for a specific borrower
    List<BookLending> findByBorrowerAndStatus(User borrower, LendingStatus status);

    long countByBorrowerAndStatus(User borrower, LendingStatus status);

    long countByBorrower(User borrower);

    // Find active lending for a specific book
    List<BookLending> findByBookAndStatus(Book book, LendingStatus status);

    // Potential future methods:
    // List<BookLending> findByLenderAndStatus(User lender, String status);
    // List<BookLending> findByBookAndStatus(Book book, String status);
    // List<BookLending> findByDueDateBeforeAndStatus(LocalDate date, String status); // For overdue books
}
