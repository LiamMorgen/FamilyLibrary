package com.familylibrary.repository;

import com.familylibrary.model.Book;
import com.familylibrary.model.ReadingHistory;
import com.familylibrary.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReadingHistoryRepository extends JpaRepository<ReadingHistory, Long> {

    List<ReadingHistory> findByUserOrderByStartDateDesc(User user);

    List<ReadingHistory> findByBook(Book book);

    // Potentially: findByUserAndBook to check if a user has a history with a specific book
    // List<ReadingHistory> findByUserAndBook(User user, Book book);
} 