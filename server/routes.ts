import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertFamilySchema, 
  insertUserFamilySchema, 
  insertBookshelfSchema, 
  insertBookSchema, 
  insertBookLendingSchema,
  insertReadingHistorySchema,
  insertActivitySchema
} from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handler middleware for Zod validation errors
  const handleZodError = (err: unknown, res: Response) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: err.errors 
      });
    }
    
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  };

  // User routes
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const newUser = await storage.createUser(userData);
      res.status(201).json(newUser);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  app.get("/api/users", async (_req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Family routes
  app.post("/api/families", async (req: Request, res: Response) => {
    try {
      const familyData = insertFamilySchema.parse(req.body);
      const newFamily = await storage.createFamily(familyData);
      res.status(201).json(newFamily);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  app.get("/api/families", async (_req: Request, res: Response) => {
    try {
      const families = await storage.getAllFamilies();
      res.json(families);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to get families" });
    }
  });

  // User-Family routes
  app.post("/api/user-families", async (req: Request, res: Response) => {
    try {
      const userFamilyData = insertUserFamilySchema.parse(req.body);
      const newUserFamily = await storage.addUserToFamily(userFamilyData);
      res.status(201).json(newUserFamily);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  app.get("/api/families/:familyId/users", async (req: Request, res: Response) => {
    try {
      const familyId = parseInt(req.params.familyId);
      const users = await storage.getUsersByFamily(familyId);
      res.json(users);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to get family users" });
    }
  });

  // Bookshelf routes
  app.post("/api/bookshelves", async (req: Request, res: Response) => {
    try {
      const bookshelfData = insertBookshelfSchema.parse(req.body);
      const newBookshelf = await storage.createBookshelf(bookshelfData);
      res.status(201).json(newBookshelf);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  app.get("/api/bookshelves", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const familyId = req.query.familyId ? parseInt(req.query.familyId as string) : undefined;
      
      if (userId) {
        const bookshelves = await storage.getBookshelfByUser(userId);
        return res.json(bookshelves);
      }
      
      if (familyId) {
        const bookshelves = await storage.getBookshelfByFamily(familyId);
        return res.json(bookshelves);
      }
      
      const bookshelves = await storage.getAllBookshelves();
      res.json(bookshelves);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to get bookshelves" });
    }
  });

  // Book routes
  app.post("/api/books", async (req: Request, res: Response) => {
    try {
      const bookData = insertBookSchema.parse(req.body);
      const newBook = await storage.createBook(bookData);
      res.status(201).json(newBook);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  app.get("/api/books", async (req: Request, res: Response) => {
    try {
      const bookshelfId = req.query.bookshelfId ? parseInt(req.query.bookshelfId as string) : undefined;
      const query = req.query.q as string | undefined;
      
      if (bookshelfId) {
        const books = await storage.getBooksByBookshelf(bookshelfId);
        return res.json(books);
      }
      
      if (query) {
        const books = await storage.searchBooks(query);
        return res.json(books);
      }
      
      const books = await storage.getAllBooks();
      res.json(books);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to get books" });
    }
  });

  app.get("/api/books/:id", async (req: Request, res: Response) => {
    try {
      const bookId = parseInt(req.params.id);
      const book = await storage.getBook(bookId);
      
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      res.json(book);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to get book" });
    }
  });

  app.patch("/api/books/:id", async (req: Request, res: Response) => {
    try {
      const bookId = parseInt(req.params.id);
      const bookData = insertBookSchema.partial().parse(req.body);
      const updatedBook = await storage.updateBook(bookId, bookData);
      
      if (!updatedBook) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      res.json(updatedBook);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  // Book Lending routes
  app.post("/api/book-lendings", async (req: Request, res: Response) => {
    try {
      const lendingData = insertBookLendingSchema.parse(req.body);
      const newLending = await storage.createBookLending(lendingData);
      
      // Update book status
      await storage.updateBook(lendingData.bookId, { status: "borrowed" });
      
      res.status(201).json(newLending);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  app.get("/api/book-lendings", async (req: Request, res: Response) => {
    try {
      const lenderId = req.query.lenderId ? parseInt(req.query.lenderId as string) : undefined;
      const borrowerId = req.query.borrowerId ? parseInt(req.query.borrowerId as string) : undefined;
      
      if (lenderId) {
        const lendings = await storage.getBookLendingsByLender(lenderId);
        return res.json(lendings);
      }
      
      if (borrowerId) {
        const lendings = await storage.getBookLendingsByBorrower(borrowerId);
        return res.json(lendings);
      }
      
      const lendings = await storage.getAllBookLendings();
      res.json(lendings);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to get book lendings" });
    }
  });

  app.patch("/api/book-lendings/:id/return", async (req: Request, res: Response) => {
    try {
      const lendingId = parseInt(req.params.id);
      const returnedLending = await storage.returnBook(lendingId);
      
      if (!returnedLending) {
        return res.status(404).json({ message: "Lending record not found" });
      }
      
      // Update book status
      await storage.updateBook(returnedLending.bookId, { status: "available" });
      
      res.json(returnedLending);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to return book" });
    }
  });

  // Reading History routes
  app.post("/api/reading-history", async (req: Request, res: Response) => {
    try {
      const historyData = insertReadingHistorySchema.parse(req.body);
      const newHistory = await storage.createReadingHistory(historyData);
      
      // Update book status to reading if starting
      if (!historyData.endDate) {
        await storage.updateBook(historyData.bookId, { status: "reading" });
      }
      
      res.status(201).json(newHistory);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  app.get("/api/reading-history", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const bookId = req.query.bookId ? parseInt(req.query.bookId as string) : undefined;
      
      if (userId) {
        const history = await storage.getReadingHistoryByUser(userId);
        return res.json(history);
      }
      
      if (bookId) {
        const history = await storage.getReadingHistoryByBook(bookId);
        return res.json(history);
      }
      
      const history = await storage.getAllReadingHistory();
      res.json(history);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to get reading history" });
    }
  });

  app.patch("/api/reading-history/:id/complete", async (req: Request, res: Response) => {
    try {
      const historyId = parseInt(req.params.id);
      const { rating, notes } = req.body;
      
      const completedHistory = await storage.completeReadingHistory(historyId, { 
        endDate: new Date(), 
        rating, 
        notes 
      });
      
      if (!completedHistory) {
        return res.status(404).json({ message: "Reading history not found" });
      }
      
      res.json(completedHistory);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to complete reading history" });
    }
  });

  // Activity routes
  app.post("/api/activities", async (req: Request, res: Response) => {
    try {
      const activityData = insertActivitySchema.parse(req.body);
      const newActivity = await storage.createActivity(activityData);
      res.status(201).json(newActivity);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  app.get("/api/activities", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const familyId = req.query.familyId ? parseInt(req.query.familyId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      if (userId) {
        const activities = await storage.getActivitiesByUser(userId, limit);
        return res.json(activities);
      }
      
      if (familyId) {
        const activities = await storage.getActivitiesByFamily(familyId, limit);
        return res.json(activities);
      }
      
      const activities = await storage.getAllActivities(limit);
      res.json(activities);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to get activities" });
    }
  });

  // Search API
  app.get("/api/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const results = await storage.searchBooks(query);
      res.json(results);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to search" });
    }
  });

  // Initialize with some sample data for testing
  app.post("/api/init-sample-data", async (_req: Request, res: Response) => {
    try {
      await storage.initializeSampleData();
      res.json({ message: "Sample data initialized" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to initialize sample data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
