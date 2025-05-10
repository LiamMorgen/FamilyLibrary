package com.familylibrary.repository;

import com.familylibrary.model.Activity;
import com.familylibrary.model.Book;
import com.familylibrary.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {

    List<Activity> findByUserOrderByTimestampDesc(User user);

    List<Activity> findByBookOrderByTimestampDesc(Book book);

    List<Activity> findByActivityTypeOrderByTimestampDesc(String activityType);

    List<Activity> findByUserAndActivityTypeOrderByTimestampDesc(User user, String activityType);

} 