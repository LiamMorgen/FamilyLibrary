import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bookshelf as UIShelf } from "@/components/ui/bookshelf";
import { BookCard } from "@/components/ui/book-card";
import ActivityFeed from "@/components/activity-feed";
import { Skeleton } from "@/components/ui/skeleton";
import type { Book, Activity, User, ShelfPosition, Bookshelf } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";

export default function Dashboard() {
  const { t } = useTranslation();

  // Initialize sample data if first time
  useEffect(() => {
    const initSampleData = async () => {
      try {
        await apiRequest("POST", "/api/init-sample-data", {});
      } catch (error) {
        console.error("Failed to initialize sample data:", error);
      }
    };

    initSampleData();
  }, []);

  // Fetch current user
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/users/current'],
  });

  // Fetch family bookshelf
  const { data: bookshelves, isLoading: isLoadingBookshelves } = useQuery<Bookshelf[]>({
    queryKey: ['/api/bookshelves'],
  });

  // Get main family bookshelf (first one)
  const familyBookshelf = bookshelves && bookshelves.length > 0 ? bookshelves[0] : null;

  // Fetch books for the family bookshelf
  const { data: books, isLoading: isLoadingBooks } = useQuery<Book[]>({
    queryKey: ['/api/books', { bookshelfId: familyBookshelf?.id }],
    enabled: !!familyBookshelf,
  });

  // Fetch recent activities
  const { data: activities, isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: ['/api/activities', { limit: 5 }],
  });

  // Fetch recent books
  const { data: recentBooks, isLoading: isLoadingRecentBooks } = useQuery<Book[]>({
    queryKey: ['/api/books', { limit: 4, sort: 'addedDate' }],
  });

  // Stats
  const totalBooks = books?.length || 0;
  const readingBooks = books?.filter(b => b.status === 'reading').length || 0;
  const borrowedBooks = books?.filter(b => b.status === 'borrowed').length || 0;
  const pendingReturnBooks = 5; // For now, hardcoded to match the design

  const handleAddBook = (shelfPosition: ShelfPosition) => {
    // Navigate to add book page with shelf position
    window.location.href = `/add-book?bookshelfId=${familyBookshelf?.id}&shelf=${shelfPosition.shelf}&position=${shelfPosition.position}`;
  };

  const handleAddShelf = () => {
    if (!familyBookshelf) return;
    
    // Update bookshelf with one more shelf
    const updatedShelfCount = (familyBookshelf.numShelves || 2) + 1;
    apiRequest("PATCH", `/api/bookshelves/${familyBookshelf.id}`, {
      numShelves: updatedShelfCount
    }).then(() => {
      // Invalidate the bookshelf query to refresh data
      // queryClient.invalidateQueries({ queryKey: ['/api/bookshelves'] });
    });
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">
            {t('dashboard.welcome', { name: currentUser?.displayName || t('dashboard.user') })}
          </h1>
          <p className="text-gray-600">{t('dashboard.today', { date: formatDate(new Date()) })}</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button asChild>
            <Link href="/add-book">
              <i className="fas fa-plus mr-2"></i>
              {t('dashboard.addNewBook')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">
                <i className="fas fa-book text-primary text-xl"></i>
              </div>
              <div className="ml-4">
                <h3 className="text-sm text-gray-500">{t('dashboard.totalBooks')}</h3>
                <p className="text-2xl font-bold">{totalBooks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <i className="fas fa-book-reader text-secondary text-xl"></i>
              </div>
              <div className="ml-4">
                <h3 className="text-sm text-gray-500">{t('dashboard.reading')}</h3>
                <p className="text-2xl font-bold">{readingBooks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <i className="fas fa-exchange-alt text-green-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <h3 className="text-sm text-gray-500">{t('dashboard.borrowed')}</h3>
                <p className="text-2xl font-bold">{borrowedBooks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <i className="fas fa-clock text-yellow-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <h3 className="text-sm text-gray-500">{t('dashboard.pendingReturn')}</h3>
                <p className="text-2xl font-bold">{pendingReturnBooks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Family Bookshelf */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-heading text-xl font-bold">{t('dashboard.familyBookshelf')}</h2>
          <Link href="/family-bookshelf" className="text-primary hover:underline text-sm flex items-center">
            {t('dashboard.viewAll')} <i className="fas fa-chevron-right ml-1 text-xs"></i>
          </Link>
        </div>
        
        {isLoadingBookshelves || isLoadingBooks ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col space-y-6">
              {[1, 2].map(index => (
                <div key={`skeleton-shelf-${index}`} className="flex flex-col">
                  <div className="flex-1 grid grid-cols-6 gap-3 mb-2 px-2 py-3 bg-gray-100 rounded">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <Skeleton key={`book-skeleton-${index}-${i}`} className="h-24 w-full rounded" />
                    ))}
                  </div>
                  <div className="h-1 bg-secondary/30 rounded-b"></div>
                </div>
              ))}
            </div>
          </div>
        ) : books && familyBookshelf ? (
          <UIShelf 
            numShelves={familyBookshelf.numShelves || 2} 
            books={books}
            onAddBook={handleAddBook}
            onAddShelf={handleAddShelf}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center py-12">
            <p className="text-gray-500 mb-4">{t('dashboard.noBookshelfFound')}</p>
            <Button>
              {t('dashboard.createBookshelf')}
            </Button>
          </div>
        )}
      </div>

      {/* Recently Added / Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recently Added Books */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-heading text-xl font-bold">{t('dashboard.recentlyAdded')}</h2>
            <Link href="/my-bookshelf" className="text-primary hover:underline text-sm flex items-center">
              {t('dashboard.viewAll')} <i className="fas fa-chevron-right ml-1 text-xs"></i>
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            {isLoadingRecentBooks ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={`recent-book-skeleton-${i}`} className="flex p-3 rounded-lg border border-gray-100">
                    <Skeleton className="w-20 h-28 rounded" />
                    <div className="ml-3 flex flex-col justify-between flex-1">
                      <div>
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-2" />
                        <div className="flex items-center mt-1">
                          <Skeleton className="h-4 w-16 rounded mr-2" />
                          <Skeleton className="h-4 w-24 rounded" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentBooks && recentBooks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentBooks.map(book => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            ) : (
              <p className="text-center py-6 text-gray-500">{t('dashboard.noRecentBooks')}</p>
            )}
          </div>
        </div>
        
        {/* Recent Activity */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-heading text-xl font-bold">{t('dashboard.recentActivity')}</h2>
          </div>
          
          <ActivityFeed activities={activities} isLoading={isLoadingActivities} />
        </div>
      </div>
    </div>
  );
}
