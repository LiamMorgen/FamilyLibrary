import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  avatar: text("avatar"),
  isOnline: boolean("is_online").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  avatar: true,
});

// Families table - to group users
export const families = pgTable("families", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const insertFamilySchema = createInsertSchema(families).pick({
  name: true,
});

// UserFamilies - many-to-many relationship
export const userFamilies = pgTable("user_families", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  familyId: integer("family_id").notNull(),
});

export const insertUserFamilySchema = createInsertSchema(userFamilies).pick({
  userId: true,
  familyId: true,
});

// Bookshelves table
export const bookshelves = pgTable("bookshelves", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  familyId: integer("family_id").notNull(),
  userId: integer("user_id").notNull(),
  numShelves: integer("num_shelves").notNull().default(3),
  isPrivate: boolean("is_private").default(false),
});

export const insertBookshelfSchema = createInsertSchema(bookshelves).pick({
  name: true,
  familyId: true,
  userId: true,
  numShelves: true,
  isPrivate: true,
});

// Books table
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  isbn: text("isbn"),
  category: text("category"),
  coverImage: text("cover_image"),
  description: text("description"),
  addedById: integer("added_by_id").notNull(),
  bookshelfId: integer("bookshelf_id").notNull(),
  shelfPosition: jsonb("shelf_position").notNull(), // { shelf: number, position: number }
  status: text("status").notNull().default("available"), // available, borrowed, reading
  addedDate: timestamp("added_date").notNull().defaultNow(),
});

export const insertBookSchema = createInsertSchema(books).pick({
  title: true,
  author: true,
  isbn: true,
  category: true,
  coverImage: true,
  description: true,
  addedById: true,
  bookshelfId: true,
  shelfPosition: true,
  status: true,
});

// BookLendings table
export const bookLendings = pgTable("book_lendings", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull(),
  lenderId: integer("lender_id").notNull(),
  borrowerId: integer("borrower_id").notNull(),
  lendDate: timestamp("lend_date").notNull().defaultNow(),
  dueDate: timestamp("due_date"),
  returnDate: timestamp("return_date"),
  status: text("status").notNull().default("borrowed"), // borrowed, returned, overdue
});

export const insertBookLendingSchema = createInsertSchema(bookLendings).pick({
  bookId: true,
  lenderId: true,
  borrowerId: true,
  dueDate: true,
  status: true,
});

// ReadingHistory table
export const readingHistory = pgTable("reading_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bookId: integer("book_id").notNull(),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  rating: integer("rating"),
  notes: text("notes"),
});

export const insertReadingHistorySchema = createInsertSchema(readingHistory).pick({
  userId: true,
  bookId: true,
  startDate: true,
  endDate: true,
  rating: true,
  notes: true,
});

// Activity table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  activityType: text("activity_type").notNull(), // read, borrow, return, add, rate
  bookId: integer("book_id"),
  relatedUserId: integer("related_user_id"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  data: jsonb("data"), // Additional activity data
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  userId: true,
  activityType: true,
  bookId: true,
  relatedUserId: true,
  data: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFamily = z.infer<typeof insertFamilySchema>;
export type Family = typeof families.$inferSelect;

export type InsertUserFamily = z.infer<typeof insertUserFamilySchema>;
export type UserFamily = typeof userFamilies.$inferSelect;

export type InsertBookshelf = z.infer<typeof insertBookshelfSchema>;
export type Bookshelf = typeof bookshelves.$inferSelect;

export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;

export type InsertBookLending = z.infer<typeof insertBookLendingSchema>;
export type BookLending = typeof bookLendings.$inferSelect;

export type InsertReadingHistory = z.infer<typeof insertReadingHistorySchema>;
export type ReadingHistory = typeof readingHistory.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
