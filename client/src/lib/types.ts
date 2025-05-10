// Types based on the schema defined in shared/schema.ts

export interface User {
  id: number;
  username: string;
  displayName: string;
  avatar?: string;
  isOnline: boolean;
}

export interface Family {
  id: number;
  name: string;
}

export interface UserFamily {
  id: number;
  userId: number;
  familyId: number;
}

export interface Bookshelf {
  id: number;
  name: string;
  familyId: number;
  userId: number;
  numShelves: number;
  isPrivate: boolean;
}

export interface ShelfPosition {
  shelf: number;
  position: number;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn?: string;
  category?: string;
  coverImage?: string;
  description?: string;
  addedById: number;
  bookshelfId: number;
  shelfPosition: ShelfPosition;
  status: string; // "available", "borrowed", "reading"
  addedDate: string | Date;
}

export interface BookLending {
  id: number;
  bookId: number;
  lenderId: number;
  borrowerId: number;
  lendDate: string | Date;
  dueDate?: string | Date;
  returnDate?: string | Date;
  status: string; // "borrowed", "returned", "overdue"
}

export interface ReadingHistory {
  id: number;
  userId: number;
  bookId: number;
  startDate: string | Date;
  endDate?: string | Date;
  rating?: number;
  notes?: string;
}

export interface Activity {
  id: number;
  userId: number;
  activityType: string; // "read", "borrow", "return", "add", "rate"
  bookId?: number;
  relatedUserId?: number;
  timestamp: string | Date;
  data?: Record<string, any>; // Additional activity data
}
