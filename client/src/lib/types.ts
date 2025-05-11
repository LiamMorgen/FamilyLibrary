// Types based on the schema defined in shared/schema.ts

export interface User {
  id: number;
  username: string;
  displayName: string;
  email?: string;
  avatar?: string;
  isOnline?: boolean;
  families?: FamilySimpleDto[];
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
  ownerId?: number | null;
  ownerUsername?: string | null;
  familyId?: number | null;
  familyName?: string | null;
  numShelves: number;
  isPrivate: boolean;
  bookIds?: number[];
  createdAt: string;
  updatedAt: string;
  books?: Book[];
  shelfNames?: Record<string, string>;
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
  coverImageUrl?: string;
  description?: string;
  addedById: number;
  addedBy?: {
    id: number;
    username: string;
    displayName?: string;
  };
  bookshelfId: number;
  shelfPosition?: ShelfPosition | null;
  status: string; // "available", "borrowed", "reading"
  addedDate: string | Date;
  currentLendingId?: number;
  currentBorrower?: {
    id: number;
    username: string;
    displayName?: string;
  };
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

export interface FamilySimpleDto {
  id: number;
  name: string;
}

// AI Related Types
export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface BookRecommendation {
  title: string;
  author: string;
  reason?: string;
  coverImageUrl?: string;
  isbn?: string;
}

export interface InitialAIAnalysisResponse {
  analysisText: string;
  recommendedBooks: BookRecommendation[];
}

export interface AIQuery {
  query: string;
  history?: AIMessage[];
}
