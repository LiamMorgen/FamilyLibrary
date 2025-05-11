package com.familylibrary.repository;

import com.familylibrary.model.Book;
import com.familylibrary.model.BookLending;
import com.familylibrary.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookLendingRepository extends JpaRepository<BookLending, Long> {

    List<BookLending> findByLender(User lender);

    List<BookLending> findByBorrower(User borrower);

    List<BookLending> findByBook(Book book);

    // Potential future methods:
    // List<BookLending> findByLenderAndStatus(User lender, String status);
    // List<BookLending> findByBorrowerAndStatus(User borrower, String status);
    // List<BookLending> findByBookAndStatus(Book book, String status);
    // List<BookLending> findByDueDateBeforeAndStatus(LocalDate date, String status); // For overdue books
}
