package com.familylibrary.service;

import com.familylibrary.model.*;
import com.familylibrary.model.BookStatus;
import com.familylibrary.model.LendingStatus;
import com.familylibrary.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;

@Service
@RequiredArgsConstructor
public class DataInitializationService {

    private final UserRepository userRepository;
    private final FamilyRepository familyRepository;
    private final BookshelfRepository bookshelfRepository;
    private final BookRepository bookRepository;
    private final BookLendingRepository bookLendingRepository;
    private final ReadingHistoryRepository readingHistoryRepository;
    private final ActivityRepository activityRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void initializeData() {
        // 检查是否已有数据，避免重复初始化 (简单检查，例如检查用户表)
        if (userRepository.count() > 0) {
            System.out.println("Sample data already exists. Skipping initialization.");
            return;
        }

        System.out.println("Initializing sample data...");

        // 1. Create Family
        Family zhangFamily = new Family();
        zhangFamily.setName("张家");
        familyRepository.save(zhangFamily);

        // 2. Create Users
        User jiahao = createUser("jiahao", "张家豪", "jiahao@example.com", "password123", "https://images.unsplash.com/photo-1601288496920-b6154fe3626a?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150", true);
        User lina = createUser("lina", "张丽娜", "lina@example.com", "password123", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150", false);
        User wei = createUser("wei", "张伟", "wei@example.com", "password123", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150", false);
        User xiaoming = createUser("xiaoming", "小明", "xiaoming@example.com", "password123", "https://pixabay.com/get/gabdd1cd2f4eddf59119f47a07092bf4b0a8be1fecbdec3cdb744772486e1ab28d92b63675cfc1cf8e6a331aefcf5fb9696bee4aacf28df50991248bc5214a55d_1280.jpg", false);

        // 3. Add Users to Family
        addMemberToFamily(zhangFamily, jiahao, lina, wei, xiaoming);

        // 4. Create Bookshelves
        Bookshelf familyBookshelf = createBookshelf("家庭书架", zhangFamily, jiahao, 2, false);
        Bookshelf jiahaoBookshelf = createBookshelf("家豪的书架", zhangFamily, jiahao, 1, true);

        // 5. Add Books
        Book book1 = createBook("三体", "刘慈欣", "9787536692978", "科幻", "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=300", "地球文明向宇宙发出的第一声啼鸣...", jiahao, familyBookshelf, 0, 0, BookStatus.AVAILABLE);
        Book book2 = createBook("活着", "余华", "9787506365437", "小说", "https://images.unsplash.com/photo-1541963463532-d68292c34b19?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=300", "《活着》是余华的代表作...", jiahao, familyBookshelf, 0, 1, BookStatus.BORROWED);
        Book book3 = createBook("平凡的世界", "路遥", "9787530216781", "文学", "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=300", "《平凡的世界》是一部全景式地表现中国当代城乡社会生活的长篇小说。", jiahao, familyBookshelf, 0, 2, BookStatus.AVAILABLE);
        Book book4 = createBook("围城", "钱钟书", "9787020090006", "文学", "https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=300", "《围城》是钱钟书所著的长篇小说，被誉为中国现代文学史上的经典。", wei, familyBookshelf, 0, 3, BookStatus.READING);
        Book book5 = createBook("解忧杂货店", "东野圭吾", "9787544270878", "小说", "https://pixabay.com/get/g1f0ab8bcefe2dffbcb70efe42e3e18be8979ec920920992ba32f3175ac64ec7acc4ef18a26f51deadbc65be8d7f075ba5c7481f0532d97804b04f68538ffee73_1280.jpg", "《解忧杂货店》是日本作家东野圭吾创作的长篇小说...", lina, familyBookshelf, 0, 4, BookStatus.AVAILABLE);
        Book book6 = createBook("追风筝的人", "卡勒德·胡赛尼", "9787208061644", "小说", "https://images.unsplash.com/photo-1589998059171-988d887df646?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=300", "《追风筝的人》是阿富汗裔美国作家卡勒德·胡赛尼的成名作。", wei, familyBookshelf, 1, 0, BookStatus.AVAILABLE);
        Book book7 = createBook("红楼梦", "曹雪芹", "9787020002207", "文学", "https://images.unsplash.com/photo-1476275466078-4007374efbbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=300", "《红楼梦》是一部中国古典长篇小说...", jiahao, familyBookshelf, 1, 1, BookStatus.AVAILABLE);
        Book book8 = createBook("百年孤独", "加西亚·马尔克斯", "9787544253994", "文学", "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=300", "《百年孤独》是哥伦比亚作家加西亚·马尔克斯的代表作...", jiahao, familyBookshelf, 1, 2, BookStatus.AVAILABLE);
        Book book9 = createBook("月亮与六便士", "毛姆", "9787532731077", "小说", "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=300", "《月亮与六便士》是英国小说家威廉·萨默塞特·毛姆的代表作之一。", lina, familyBookshelf, 1, 3, BookStatus.AVAILABLE);

        // 6. Create Book Lendings
        createBookLending(book2, wei, xiaoming, LocalDateTime.now().plusDays(14));

        // 7. Create Reading History
        createReadingHistory(lina, book1, LocalDateTime.now(), null, null, null);
        createReadingHistory(wei, book4, LocalDateTime.now().minusDays(5), null, null, null);

        // 8. Create Activities
        createActivity(lina, "read", book1, null, "{\"action\": \"started_reading\"}");
        createActivity(xiaoming, "borrow", book2, wei, "{\"action\": \"borrowed_book\"}");
        createActivity(jiahao, "add", book3, null, "{\"action\": \"added_book\"}");
        createActivity(wei, "rate", book4, null, "{\"action\": \"rated_book\", \"rating\": 5}");
        createActivity(lina, "return", book5, jiahao, "{\"action\": \"returned_book\"}");

        System.out.println("Sample data initialized.");
    }

    private User createUser(String username, String displayName, String email, String password, String avatar, boolean isOnline) {
        User user = new User();
        user.setUsername(username);
        user.setDisplayName(displayName);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setAvatar(avatar);
        user.setOnline(isOnline);
        return userRepository.save(user);
    }

    private void addMemberToFamily(Family family, User... users) {
        Arrays.stream(users).forEach(user -> {
            user.getFamilies().add(family); // Add family to user's set of families
            family.getMembers().add(user);  // Add user to family's set of members
            userRepository.save(user);      // Persist user to update the join table
        });
        familyRepository.save(family); // Persist family to update the join table from family side if needed
    }

    private Bookshelf createBookshelf(String name, Family family, User owner, int numShelves, boolean isPrivate) {
        Bookshelf bookshelf = new Bookshelf();
        bookshelf.setName(name);
        bookshelf.setFamily(family);
        bookshelf.setOwner(owner);
        bookshelf.setNumShelves(numShelves);
        bookshelf.setPrivate(isPrivate);
        return bookshelfRepository.save(bookshelf);
    }

    private Book createBook(String title, String author, String isbn, String category, String coverImage, 
                            String description, User addedBy, Bookshelf bookshelf, 
                            Integer shelfNumber, Integer positionNumber, BookStatus status) {
        Book book = new Book();
        book.setTitle(title);
        book.setAuthor(author);
        book.setIsbn(isbn);
        book.setCategory(category);
        book.setCoverImage(coverImage);
        book.setDescription(description);
        book.setAddedBy(addedBy);
        book.setBookshelf(bookshelf);
        book.setShelfNumber(shelfNumber);
        book.setPositionNumber(positionNumber);
        book.setStatus(status);
        return bookRepository.save(book);
    }

    private void createBookLending(Book book, User lender, User borrower, LocalDateTime dueDate) {
        BookLending lending = new BookLending();
        lending.setBook(book);
        lending.setLender(lender);
        lending.setBorrower(borrower);
        lending.setLendDate(LocalDateTime.now());
        lending.setDueDate(dueDate);
        lending.setStatus(LendingStatus.BORROWED);
        bookLendingRepository.save(lending);
    }

    private void createReadingHistory(User user, Book book, LocalDateTime startDate, LocalDateTime endDate, Integer rating, String notes) {
        ReadingHistory history = new ReadingHistory();
        history.setUser(user);
        history.setBook(book);
        if (startDate != null) history.setStartDate(startDate);
        if (endDate != null) history.setEndDate(endDate);
        if (rating != null) history.setRating(rating);
        if (notes != null) history.setNotes(notes);
        readingHistoryRepository.save(history);
    }

    private void createActivity(User user, String activityType, Book book, User relatedUser, String data) {
        Activity activity = new Activity();
        activity.setUser(user);
        activity.setActivityType(activityType);
        if (book != null) activity.setBook(book);
        if (relatedUser != null) activity.setRelatedUser(relatedUser);
        if (data != null) activity.setData(data);
        // Timestamp is set by @PrePersist in Activity entity
        activityRepository.save(activity);
    }
} 