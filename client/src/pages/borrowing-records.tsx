import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { BookLending, Book, User } from "@/lib/types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";

export default function BorrowingRecords() {
  const { t } = useTranslation();

  // Fetch lendings where current user is the lender
  const { data: lentBooks, isLoading: isLoadingLent } = useQuery<BookLending[]>({
    queryKey: ['/api/book-lendings', { lenderId: 'current' }],
  });

  // Fetch lendings where current user is the borrower
  const { data: borrowedBooks, isLoading: isLoadingBorrowed } = useQuery<BookLending[]>({
    queryKey: ['/api/book-lendings', { borrowerId: 'current' }],
  });

  // Fetch all books for reference
  const { data: allBooks } = useQuery<Book[]>({
    queryKey: ['/api/books'],
  });

  // Fetch all users for reference
  const { data: allUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const getBookById = (bookId: number) => {
    return allBooks?.find(book => book.id === bookId);
  };

  const getUserById = (userId: number) => {
    return allUsers?.find(user => user.id === userId);
  };

  const handleReturnBook = async (lendingId: number) => {
    try {
      await apiRequest("PATCH", `/api/book-lendings/${lendingId}/return`, {});
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/book-lendings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
    } catch (error) {
      console.error("Failed to return book:", error);
    }
  };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-primary mb-6">{t('borrowingRecords.title')}</h1>

      <Tabs defaultValue="borrowed" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="borrowed">
            {t('borrowingRecords.borrowed')}
            {borrowedBooks && borrowedBooks.filter(b => b.status === 'borrowed').length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {borrowedBooks.filter(b => b.status === 'borrowed').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="lent">
            {t('borrowingRecords.lent')}
            {lentBooks && lentBooks.filter(b => b.status === 'borrowed').length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {lentBooks.filter(b => b.status === 'borrowed').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">
            {t('borrowingRecords.history')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="borrowed">
          {isLoadingBorrowed ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : borrowedBooks && borrowedBooks.filter(b => b.status === 'borrowed').length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('borrowingRecords.book')}</TableHead>
                  <TableHead>{t('borrowingRecords.lender')}</TableHead>
                  <TableHead>{t('borrowingRecords.borrowDate')}</TableHead>
                  <TableHead>{t('borrowingRecords.dueDate')}</TableHead>
                  <TableHead>{t('borrowingRecords.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {borrowedBooks
                  .filter(lending => lending.status === 'borrowed')
                  .map(lending => {
                    const book = getBookById(lending.bookId);
                    const lender = getUserById(lending.lenderId);
                    
                    return (
                      <TableRow key={lending.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            {book?.coverImage && (
                              <img 
                                src={book.coverImage} 
                                alt={book.title} 
                                className="w-8 h-10 object-cover rounded mr-2"
                              />
                            )}
                            <span>{book?.title || t('borrowingRecords.unknownBook')}</span>
                          </div>
                        </TableCell>
                        <TableCell>{lender?.displayName || t('borrowingRecords.unknownUser')}</TableCell>
                        <TableCell>{formatDate(new Date(lending.lendDate))}</TableCell>
                        <TableCell>
                          {lending.dueDate ? formatDate(new Date(lending.dueDate)) : t('borrowingRecords.noDueDate')}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleReturnBook(lending.id)}
                          >
                            {t('borrowingRecords.return')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-2">{t('borrowingRecords.noBorrowedBooks')}</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="lent">
          {isLoadingLent ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : lentBooks && lentBooks.filter(b => b.status === 'borrowed').length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('borrowingRecords.book')}</TableHead>
                  <TableHead>{t('borrowingRecords.borrower')}</TableHead>
                  <TableHead>{t('borrowingRecords.borrowDate')}</TableHead>
                  <TableHead>{t('borrowingRecords.dueDate')}</TableHead>
                  <TableHead>{t('borrowingRecords.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lentBooks
                  .filter(lending => lending.status === 'borrowed')
                  .map(lending => {
                    const book = getBookById(lending.bookId);
                    const borrower = getUserById(lending.borrowerId);
                    const isOverdue = lending.dueDate && new Date(lending.dueDate) < new Date();
                    
                    return (
                      <TableRow key={lending.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            {book?.coverImage && (
                              <img 
                                src={book.coverImage} 
                                alt={book.title} 
                                className="w-8 h-10 object-cover rounded mr-2"
                              />
                            )}
                            <span>{book?.title || t('borrowingRecords.unknownBook')}</span>
                          </div>
                        </TableCell>
                        <TableCell>{borrower?.displayName || t('borrowingRecords.unknownUser')}</TableCell>
                        <TableCell>{formatDate(new Date(lending.lendDate))}</TableCell>
                        <TableCell>
                          {lending.dueDate ? formatDate(new Date(lending.dueDate)) : t('borrowingRecords.noDueDate')}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-block px-2 py-1 rounded text-xs ${
                            isOverdue 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {isOverdue 
                              ? t('borrowingRecords.overdue') 
                              : t('borrowingRecords.borrowed')}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-2">{t('borrowingRecords.noLentBooks')}</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="history">
          {isLoadingLent || isLoadingBorrowed ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('borrowingRecords.book')}</TableHead>
                  <TableHead>{t('borrowingRecords.person')}</TableHead>
                  <TableHead>{t('borrowingRecords.borrowDate')}</TableHead>
                  <TableHead>{t('borrowingRecords.returnDate')}</TableHead>
                  <TableHead>{t('borrowingRecords.type')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...(lentBooks || []), ...(borrowedBooks || [])].filter(lending => lending.status === 'returned')
                  .sort((a, b) => new Date(b.returnDate || 0).getTime() - new Date(a.returnDate || 0).getTime())
                  .map(lending => {
                    const book = getBookById(lending.bookId);
                    const person = lending.lenderId === 1 // Assuming current user ID is 1
                      ? getUserById(lending.borrowerId)
                      : getUserById(lending.lenderId);
                    const isLent = lending.lenderId === 1; // Assuming current user ID is 1
                    
                    return (
                      <TableRow key={lending.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            {book?.coverImage && (
                              <img 
                                src={book.coverImage} 
                                alt={book.title} 
                                className="w-8 h-10 object-cover rounded mr-2"
                              />
                            )}
                            <span>{book?.title || t('borrowingRecords.unknownBook')}</span>
                          </div>
                        </TableCell>
                        <TableCell>{person?.displayName || t('borrowingRecords.unknownUser')}</TableCell>
                        <TableCell>{formatDate(new Date(lending.lendDate))}</TableCell>
                        <TableCell>
                          {lending.returnDate ? formatDate(new Date(lending.returnDate)) : '-'}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-block px-2 py-1 rounded text-xs ${
                            isLent
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {isLent 
                              ? t('borrowingRecords.lentOut') 
                              : t('borrowingRecords.borrowedFrom')}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
