import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BookForm } from "@/components/book-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Bookshelf as BookshelfType } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AddBookPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Parse query parameters to get bookshelf ID and position
  const searchParams = new URLSearchParams(window.location.search);
  const bookshelfId = searchParams.get('bookshelfId') ? parseInt(searchParams.get('bookshelfId')!) : undefined;
  const shelf = searchParams.get('shelf') ? parseInt(searchParams.get('shelf')!) : 0;
  const position = searchParams.get('position') ? parseInt(searchParams.get('position')!) : 0;

  // Fetch bookshelves for selection
  const { data: bookshelves, isLoading: isLoadingBookshelves } = useQuery<BookshelfType[]>({
    queryKey: ['/api/bookshelves'],
  });

  // Handle ISBN search
  const handleIsbnSearch = () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // In a real application, you'd call an API to search for book information by ISBN
    // For now, we'll simulate a search with a timeout
    setTimeout(() => {
      setIsSearching(false);
      // You'd normally set the book data from the API response
    }, 1500);
  };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-primary mb-6">{t('addBook.title')}</h1>

      <Tabs defaultValue="manual" className="mb-6">
        <TabsList>
          <TabsTrigger value="manual">{t('addBook.manualEntry')}</TabsTrigger>
          <TabsTrigger value="isbn">{t('addBook.searchByIsbn')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>{t('addBook.bookDetails')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingBookshelves ? (
                <Skeleton className="h-96 w-full" />
              ) : (
                <BookForm 
                  initialBookshelfId={bookshelfId}
                  initialShelf={shelf}
                  initialPosition={position}
                  bookshelves={bookshelves || []}
                  onSuccess={() => {
                    navigate('/');
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="isbn">
          <Card>
            <CardHeader>
              <CardTitle>{t('addBook.searchByIsbnTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-4">{t('addBook.isbnInstructions')}</p>
                <div className="flex gap-2">
                  <Input
                    placeholder={t('addBook.isbnPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleIsbnSearch}
                    disabled={isSearching || !searchQuery.trim()}
                  >
                    {isSearching ? (
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                    ) : (
                      <i className="fas fa-search mr-2"></i>
                    )}
                    {t('addBook.search')}
                  </Button>
                </div>
              </div>
              
              {isSearching ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full mb-2" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-32 w-full mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <BookForm 
                  initialBookshelfId={bookshelfId}
                  initialShelf={shelf}
                  initialPosition={position}
                  bookshelves={bookshelves || []}
                  onSuccess={() => {
                    navigate('/');
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-center mt-8">
        <p className="text-sm text-gray-500 mb-2">{t('addBook.needHelp')}</p>
        <Button variant="link">{t('addBook.contactSupport')}</Button>
      </div>
    </div>
  );
}
