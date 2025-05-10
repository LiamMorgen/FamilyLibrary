import { 
  type User, type InsertUser,
  type Family, type InsertFamily,
  type UserFamily, type InsertUserFamily,
  type Bookshelf, type InsertBookshelf,
  type Book, type InsertBook,
  type BookLending, type InsertBookLending,
  type ReadingHistory, type InsertReadingHistory,
  type Activity, type InsertActivity
} from "@shared/schema";

// Interface for all storage methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Family methods
  getFamily(id: number): Promise<Family | undefined>;
  createFamily(family: InsertFamily): Promise<Family>;
  getAllFamilies(): Promise<Family[]>;

  // User-Family methods
  addUserToFamily(userFamily: InsertUserFamily): Promise<UserFamily>;
  getUsersByFamily(familyId: number): Promise<User[]>;

  // Bookshelf methods
  getBookshelf(id: number): Promise<Bookshelf | undefined>;
  createBookshelf(bookshelf: InsertBookshelf): Promise<Bookshelf>;
  getAllBookshelves(): Promise<Bookshelf[]>;
  getBookshelfByUser(userId: number): Promise<Bookshelf[]>;
  getBookshelfByFamily(familyId: number): Promise<Bookshelf[]>;

  // Book methods
  getBook(id: number): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: number, book: Partial<InsertBook>): Promise<Book | undefined>;
  getAllBooks(): Promise<Book[]>;
  getBooksByBookshelf(bookshelfId: number): Promise<Book[]>;
  searchBooks(query: string): Promise<Book[]>;

  // Book Lending methods
  getBookLending(id: number): Promise<BookLending | undefined>;
  createBookLending(lending: InsertBookLending): Promise<BookLending>;
  getAllBookLendings(): Promise<BookLending[]>;
  getBookLendingsByLender(lenderId: number): Promise<BookLending[]>;
  getBookLendingsByBorrower(borrowerId: number): Promise<BookLending[]>;
  returnBook(id: number): Promise<BookLending | undefined>;

  // Reading History methods
  getReadingHistory(id: number): Promise<ReadingHistory | undefined>;
  createReadingHistory(history: InsertReadingHistory): Promise<ReadingHistory>;
  getAllReadingHistory(): Promise<ReadingHistory[]>;
  getReadingHistoryByUser(userId: number): Promise<ReadingHistory[]>;
  getReadingHistoryByBook(bookId: number): Promise<ReadingHistory[]>;
  completeReadingHistory(id: number, data: Partial<ReadingHistory>): Promise<ReadingHistory | undefined>;

  // Activity methods
  createActivity(activity: InsertActivity): Promise<Activity>;
  getAllActivities(limit?: number): Promise<Activity[]>;
  getActivitiesByUser(userId: number, limit?: number): Promise<Activity[]>;
  getActivitiesByFamily(familyId: number, limit?: number): Promise<Activity[]>;
  
  // Helper for initializing sample data
  initializeSampleData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private families: Map<number, Family>;
  private userFamilies: Map<number, UserFamily>;
  private bookshelves: Map<number, Bookshelf>;
  private books: Map<number, Book>;
  private bookLendings: Map<number, BookLending>;
  private readingHistory: Map<number, ReadingHistory>;
  private activities: Map<number, Activity>;

  private currentIds: {
    users: number;
    families: number;
    userFamilies: number;
    bookshelves: number;
    books: number;
    bookLendings: number;
    readingHistory: number;
    activities: number;
  };

  constructor() {
    this.users = new Map();
    this.families = new Map();
    this.userFamilies = new Map();
    this.bookshelves = new Map();
    this.books = new Map();
    this.bookLendings = new Map();
    this.readingHistory = new Map();
    this.activities = new Map();

    this.currentIds = {
      users: 1,
      families: 1,
      userFamilies: 1,
      bookshelves: 1,
      books: 1,
      bookLendings: 1,
      readingHistory: 1,
      activities: 1
    };
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const user: User = { ...insertUser, id, isOnline: false };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Family methods
  async getFamily(id: number): Promise<Family | undefined> {
    return this.families.get(id);
  }

  async createFamily(insertFamily: InsertFamily): Promise<Family> {
    const id = this.currentIds.families++;
    const family: Family = { ...insertFamily, id };
    this.families.set(id, family);
    return family;
  }

  async getAllFamilies(): Promise<Family[]> {
    return Array.from(this.families.values());
  }

  // User-Family methods
  async addUserToFamily(insertUserFamily: InsertUserFamily): Promise<UserFamily> {
    const id = this.currentIds.userFamilies++;
    const userFamily: UserFamily = { ...insertUserFamily, id };
    this.userFamilies.set(id, userFamily);
    return userFamily;
  }

  async getUsersByFamily(familyId: number): Promise<User[]> {
    const userFamilyEntries = Array.from(this.userFamilies.values())
      .filter(uf => uf.familyId === familyId);
    
    const users = userFamilyEntries
      .map(uf => this.users.get(uf.userId))
      .filter((user): user is User => user !== undefined);
    
    return users;
  }

  // Bookshelf methods
  async getBookshelf(id: number): Promise<Bookshelf | undefined> {
    return this.bookshelves.get(id);
  }

  async createBookshelf(insertBookshelf: InsertBookshelf): Promise<Bookshelf> {
    const id = this.currentIds.bookshelves++;
    const bookshelf: Bookshelf = { ...insertBookshelf, id };
    this.bookshelves.set(id, bookshelf);
    return bookshelf;
  }

  async getAllBookshelves(): Promise<Bookshelf[]> {
    return Array.from(this.bookshelves.values());
  }

  async getBookshelfByUser(userId: number): Promise<Bookshelf[]> {
    return Array.from(this.bookshelves.values())
      .filter(bs => bs.userId === userId);
  }

  async getBookshelfByFamily(familyId: number): Promise<Bookshelf[]> {
    return Array.from(this.bookshelves.values())
      .filter(bs => bs.familyId === familyId && !bs.isPrivate);
  }

  // Book methods
  async getBook(id: number): Promise<Book | undefined> {
    return this.books.get(id);
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const id = this.currentIds.books++;
    const addedDate = new Date();
    const book: Book = { ...insertBook, id, addedDate };
    this.books.set(id, book);
    return book;
  }

  async updateBook(id: number, bookUpdate: Partial<InsertBook>): Promise<Book | undefined> {
    const book = this.books.get(id);
    
    if (!book) {
      return undefined;
    }
    
    const updatedBook: Book = { ...book, ...bookUpdate };
    this.books.set(id, updatedBook);
    return updatedBook;
  }

  async getAllBooks(): Promise<Book[]> {
    return Array.from(this.books.values());
  }

  async getBooksByBookshelf(bookshelfId: number): Promise<Book[]> {
    return Array.from(this.books.values())
      .filter(book => book.bookshelfId === bookshelfId);
  }

  async searchBooks(query: string): Promise<Book[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.books.values()).filter(book => 
      book.title.toLowerCase().includes(searchTerm) ||
      book.author.toLowerCase().includes(searchTerm) ||
      (book.isbn && book.isbn.includes(searchTerm)) ||
      (book.category && book.category.toLowerCase().includes(searchTerm))
    );
  }

  // Book Lending methods
  async getBookLending(id: number): Promise<BookLending | undefined> {
    return this.bookLendings.get(id);
  }

  async createBookLending(insertLending: InsertBookLending): Promise<BookLending> {
    const id = this.currentIds.bookLendings++;
    const lendDate = new Date();
    const lending: BookLending = { 
      ...insertLending, 
      id, 
      lendDate,
      returnDate: undefined 
    };
    this.bookLendings.set(id, lending);
    return lending;
  }

  async getAllBookLendings(): Promise<BookLending[]> {
    return Array.from(this.bookLendings.values());
  }

  async getBookLendingsByLender(lenderId: number): Promise<BookLending[]> {
    return Array.from(this.bookLendings.values())
      .filter(lending => lending.lenderId === lenderId);
  }

  async getBookLendingsByBorrower(borrowerId: number): Promise<BookLending[]> {
    return Array.from(this.bookLendings.values())
      .filter(lending => lending.borrowerId === borrowerId);
  }

  async returnBook(id: number): Promise<BookLending | undefined> {
    const lending = this.bookLendings.get(id);
    
    if (!lending) {
      return undefined;
    }
    
    const returnDate = new Date();
    const updatedLending: BookLending = { 
      ...lending, 
      returnDate, 
      status: "returned" 
    };
    
    this.bookLendings.set(id, updatedLending);
    return updatedLending;
  }

  // Reading History methods
  async getReadingHistory(id: number): Promise<ReadingHistory | undefined> {
    return this.readingHistory.get(id);
  }

  async createReadingHistory(insertHistory: InsertReadingHistory): Promise<ReadingHistory> {
    const id = this.currentIds.readingHistory++;
    const history: ReadingHistory = { ...insertHistory, id };
    this.readingHistory.set(id, history);
    return history;
  }

  async getAllReadingHistory(): Promise<ReadingHistory[]> {
    return Array.from(this.readingHistory.values());
  }

  async getReadingHistoryByUser(userId: number): Promise<ReadingHistory[]> {
    return Array.from(this.readingHistory.values())
      .filter(history => history.userId === userId);
  }

  async getReadingHistoryByBook(bookId: number): Promise<ReadingHistory[]> {
    return Array.from(this.readingHistory.values())
      .filter(history => history.bookId === bookId);
  }

  async completeReadingHistory(id: number, updateData: Partial<ReadingHistory>): Promise<ReadingHistory | undefined> {
    const history = this.readingHistory.get(id);
    
    if (!history) {
      return undefined;
    }
    
    const updatedHistory: ReadingHistory = { ...history, ...updateData };
    this.readingHistory.set(id, updatedHistory);
    return updatedHistory;
  }

  // Activity methods
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentIds.activities++;
    const timestamp = new Date();
    const activity: Activity = { ...insertActivity, id, timestamp };
    this.activities.set(id, activity);
    return activity;
  }

  async getAllActivities(limit?: number): Promise<Activity[]> {
    const activities = Array.from(this.activities.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? activities.slice(0, limit) : activities;
  }

  async getActivitiesByUser(userId: number, limit?: number): Promise<Activity[]> {
    const activities = Array.from(this.activities.values())
      .filter(activity => activity.userId === userId || activity.relatedUserId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? activities.slice(0, limit) : activities;
  }

  async getActivitiesByFamily(familyId: number, limit?: number): Promise<Activity[]> {
    // Get all users in this family
    const familyUsers = await this.getUsersByFamily(familyId);
    const familyUserIds = familyUsers.map(user => user.id);
    
    const activities = Array.from(this.activities.values())
      .filter(activity => 
        familyUserIds.includes(activity.userId) || 
        (activity.relatedUserId !== undefined && familyUserIds.includes(activity.relatedUserId))
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? activities.slice(0, limit) : activities;
  }

  // Helper method to initialize sample data
  async initializeSampleData(): Promise<void> {
    // Create family
    const zhangFamily = await this.createFamily({ name: "张家" });

    // Create users
    const jiahao = await this.createUser({ 
      username: "jiahao", 
      password: "password", 
      displayName: "张家豪",
      avatar: "https://images.unsplash.com/photo-1601288496920-b6154fe3626a?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"
    });
    
    const lina = await this.createUser({ 
      username: "lina", 
      password: "password", 
      displayName: "张丽娜",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"
    });
    
    const wei = await this.createUser({ 
      username: "wei", 
      password: "password", 
      displayName: "张伟",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"
    });
    
    const xiaoming = await this.createUser({ 
      username: "xiaoming", 
      password: "password", 
      displayName: "小明",
      avatar: "https://pixabay.com/get/gabdd1cd2f4eddf59119f47a07092bf4b0a8be1fecbdec3cdb744772486e1ab28d92b63675cfc1cf8e6a331aefcf5fb9696bee4aacf28df50991248bc5214a55d_1280.jpg"
    });

    // Set jiahao as online
    await this.updateUserOnlineStatus(jiahao.id, true);

    // Add users to family
    await this.addUserToFamily({ userId: jiahao.id, familyId: zhangFamily.id });
    await this.addUserToFamily({ userId: lina.id, familyId: zhangFamily.id });
    await this.addUserToFamily({ userId: wei.id, familyId: zhangFamily.id });
    await this.addUserToFamily({ userId: xiaoming.id, familyId: zhangFamily.id });

    // Create family bookshelf
    const familyBookshelf = await this.createBookshelf({
      name: "家庭书架",
      familyId: zhangFamily.id,
      userId: jiahao.id,
      numShelves: 2,
      isPrivate: false
    });

    // Create jiahao's personal bookshelf
    const jiahaoBookshelf = await this.createBookshelf({
      name: "家豪的书架",
      familyId: zhangFamily.id,
      userId: jiahao.id,
      numShelves: 1,
      isPrivate: true
    });

    // Add books to family bookshelf
    const book1 = await this.createBook({
      title: "三体",
      author: "刘慈欣",
      isbn: "9787536692978",
      category: "科幻",
      coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=300",
      description: "地球文明向宇宙发出的第一声啼鸣，以及以此为开端，地球文明与三体文明间的复杂信息战。",
      addedById: jiahao.id,
      bookshelfId: familyBookshelf.id,
      shelfPosition: { shelf: 0, position: 0 },
      status: "available",
    });

    const book2 = await this.createBook({
      title: "活着",
      author: "余华",
      isbn: "9787506365437",
      category: "小说",
      coverImage: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=300",
      description: "《活着》是余华的代表作，讲述了农村人福贵悲惨的人生遭遇。",
      addedById: jiahao.id,
      bookshelfId: familyBookshelf.id,
      shelfPosition: { shelf: 0, position: 1 },
      status: "borrowed",
    });

    const book3 = await this.createBook({
      title: "平凡的世界",
      author: "路遥",
      isbn: "9787530216781",
      category: "文学",
      coverImage: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=300",
      description: "《平凡的世界》是一部全景式地表现中国当代城乡社会生活的长篇小说。",
      addedById: jiahao.id,
      bookshelfId: familyBookshelf.id,
      shelfPosition: { shelf: 0, position: 2 },
      status: "available",
    });

    const book4 = await this.createBook({
      title: "围城",
      author: "钱钟书",
      isbn: "9787020090006",
      category: "文学",
      coverImage: "https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=300",
      description: "《围城》是钱钟书所著的长篇小说，被誉为中国现代文学史上的经典。",
      addedById: wei.id,
      bookshelfId: familyBookshelf.id,
      shelfPosition: { shelf: 0, position: 3 },
      status: "reading",
    });

    const book5 = await this.createBook({
      title: "解忧杂货店",
      author: "东野圭吾",
      isbn: "9787544270878",
      category: "小说",
      coverImage: "https://pixabay.com/get/g1f0ab8bcefe2dffbcb70efe42e3e18be8979ec920920992ba32f3175ac64ec7acc4ef18a26f51deadbc65be8d7f075ba5c7481f0532d97804b04f68538ffee73_1280.jpg",
      description: "《解忧杂货店》是日本作家东野圭吾创作的长篇小说，讲述了在一家可以咨询烦恼的杂货店，对来信者的回答会发生奇妙的效果。",
      addedById: lina.id,
      bookshelfId: familyBookshelf.id,
      shelfPosition: { shelf: 0, position: 4 },
      status: "available",
    });

    const book6 = await this.createBook({
      title: "追风筝的人",
      author: "卡勒德·胡赛尼",
      isbn: "9787208061644",
      category: "小说",
      coverImage: "https://images.unsplash.com/photo-1589998059171-988d887df646?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=300",
      description: "《追风筝的人》是阿富汗裔美国作家卡勒德·胡赛尼的成名作。",
      addedById: wei.id,
      bookshelfId: familyBookshelf.id,
      shelfPosition: { shelf: 1, position: 0 },
      status: "available",
    });

    const book7 = await this.createBook({
      title: "红楼梦",
      author: "曹雪芹",
      isbn: "9787020002207",
      category: "文学",
      coverImage: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=300",
      description: "《红楼梦》是一部中国古典长篇小说，被誉为中国古典小说的巅峰之作。",
      addedById: jiahao.id,
      bookshelfId: familyBookshelf.id,
      shelfPosition: { shelf: 1, position: 1 },
      status: "available",
    });

    const book8 = await this.createBook({
      title: "百年孤独",
      author: "加西亚·马尔克斯",
      isbn: "9787544253994",
      category: "文学",
      coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=300",
      description: "《百年孤独》是哥伦比亚作家加西亚·马尔克斯的代表作，也是魔幻现实主义文学的代表作之一。",
      addedById: jiahao.id,
      bookshelfId: familyBookshelf.id,
      shelfPosition: { shelf: 1, position: 2 },
      status: "available",
    });

    const book9 = await this.createBook({
      title: "月亮与六便士",
      author: "毛姆",
      isbn: "9787532731077",
      category: "小说",
      coverImage: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=300",
      description: "《月亮与六便士》是英国小说家威廉·萨默塞特·毛姆的代表作之一。",
      addedById: lina.id,
      bookshelfId: familyBookshelf.id,
      shelfPosition: { shelf: 1, position: 3 },
      status: "available",
    });

    // Create book lendings
    await this.createBookLending({
      bookId: book2.id,
      lenderId: wei.id,
      borrowerId: xiaoming.id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Due in 14 days
      status: "borrowed"
    });

    // Create reading history
    await this.createReadingHistory({
      userId: lina.id,
      bookId: book1.id,
      startDate: new Date(),
      endDate: undefined,
      rating: undefined,
      notes: undefined
    });

    await this.createReadingHistory({
      userId: wei.id,
      bookId: book4.id,
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Started 5 days ago
      endDate: undefined,
      rating: undefined,
      notes: undefined
    });

    // Create activities
    await this.createActivity({
      userId: lina.id,
      activityType: "read",
      bookId: book1.id,
      relatedUserId: undefined,
      data: { action: "started_reading" }
    });

    await this.createActivity({
      userId: xiaoming.id,
      activityType: "borrow",
      bookId: book2.id,
      relatedUserId: wei.id,
      data: { action: "borrowed_book" }
    });

    await this.createActivity({
      userId: jiahao.id,
      activityType: "add",
      bookId: book3.id,
      relatedUserId: undefined,
      data: { action: "added_book" }
    });

    await this.createActivity({
      userId: wei.id,
      activityType: "rate",
      bookId: book4.id,
      relatedUserId: undefined,
      data: { action: "rated_book", rating: 5 }
    });

    await this.createActivity({
      userId: lina.id,
      activityType: "return",
      bookId: book5.id,
      relatedUserId: jiahao.id,
      data: { action: "returned_book" }
    });
  }

  // Additional helper method not in interface
  async updateUserOnlineStatus(userId: number, isOnline: boolean): Promise<User | undefined> {
    const user = this.users.get(userId);
    
    if (!user) {
      return undefined;
    }
    
    const updatedUser: User = { ...user, isOnline };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
}

export const storage = new MemStorage();
