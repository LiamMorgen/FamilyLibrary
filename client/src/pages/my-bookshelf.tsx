import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { Book, Bookshelf as BookshelfType, ShelfPosition } from "@/lib/types";
import { Bookshelf } from "@/components/ui/bookshelf";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

export default function MyBookshelf() {
  const { t } = useTranslation();
  const [_, navigate] = useLocation();

  // Fetch current user's bookshelf
  const { data: myBookshelves, isLoading: isLoadingBookshelves } = useQuery<BookshelfType[]>({
    queryKey: ['/api/bookshelves', { userId: 'current' }],
  });

  // Get personal bookshelf (first one)
  const myBookshelf = myBookshelves && myBookshelves.length > 0 ? myBookshelves[0] : null;

  // Fetch books for the personal bookshelf
  const { data: books, isLoading: isLoadingBooks } = useQuery<Book[]>({
    queryKey: ['/api/books', { bookshelfId: myBookshelf?.id }],
    enabled: !!myBookshelf,
  });

  const handleAddBook = (shelfPosition: ShelfPosition) => {
    navigate(`/add-book?bookshelfId=${myBookshelf?.id}&shelf=${shelfPosition.shelf}&position=${shelfPosition.position}`);
  };

  const handleCreateBookshelf = () => {
    // Handle creating a new bookshelf for the user
    // In a real app, this would open a form or modal
    console.log("Create new bookshelf");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-heading text-2xl font-bold text-primary">{t('myBookshelf.title')}</h1>
        <Button onClick={() => navigate('/add-book')}>
          <i className="fas fa-plus mr-2"></i>
          {t('myBookshelf.addBook')}
        </Button>
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
      ) : books && myBookshelf ? (
        <Bookshelf 
          numShelves={myBookshelf.numShelves || 2} 
          books={books}
          onAddBook={handleAddBook}
          onAddShelf={() => {}} // Not allowing adding shelves to personal bookshelf
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center py-12">
          <p className="text-gray-500 mb-4">{t('myBookshelf.noBookshelfFound')}</p>
          <Button onClick={handleCreateBookshelf}>
            {t('myBookshelf.createBookshelf')}
          </Button>
        </div>
      )}

      <div className="mt-8">
        <h2 className="font-heading text-xl font-bold mb-4">{t('myBookshelf.categories')}</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {['科幻', '小说', '文学', '历史', '心理学', '科普', '传记', '艺术'].map(category => (
            <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <h3 className="font-heading">{category}</h3>
                <span className="text-gray-500 text-sm">
                  {Math.floor(Math.random() * 20)} {t('myBookshelf.books')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
