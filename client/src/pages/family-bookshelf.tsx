import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { Book, Bookshelf as BookshelfType, ShelfPosition } from "@/lib/types";
import { Bookshelf } from "@/components/ui/bookshelf";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

export default function FamilyBookshelf() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Fetch family bookshelves
  const { data: familyBookshelves, isLoading: isLoadingBookshelves } = useQuery<BookshelfType[]>({
    queryKey: ['/api/bookshelves', { familyId: 'current' }],
  });

  // Get main family bookshelf (first one)
  const activeBookshelf = familyBookshelves && familyBookshelves.length > 0 ? familyBookshelves[0] : null;

  // Fetch books for the active bookshelf
  const { data: books, isLoading: isLoadingBooks } = useQuery<Book[]>({
    queryKey: ['/api/books', { bookshelfId: activeBookshelf?.id }],
    enabled: !!activeBookshelf,
  });

  const handleAddBook = (shelfPosition: ShelfPosition) => {
    navigate(`/add-book?bookshelfId=${activeBookshelf?.id}&shelf=${shelfPosition.shelf}&position=${shelfPosition.position}`);
  };

  const handleAddShelf = () => {
    // Handle adding a new shelf to the bookshelf
    console.log("Add new shelf");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-heading text-2xl font-bold text-primary">{t('familyBookshelf.title')}</h1>
        <Button onClick={() => navigate('/add-book')}>
          <i className="fas fa-plus mr-2"></i>
          {t('familyBookshelf.addBook')}
        </Button>
      </div>

      {isLoadingBookshelves ? (
        <Skeleton className="h-10 w-full max-w-md mb-4" />
      ) : familyBookshelves && familyBookshelves.length > 0 ? (
        <Tabs defaultValue={familyBookshelves[0].id.toString()} className="mb-6">
          <TabsList className="w-full max-w-md mb-4">
            {familyBookshelves.map(bookshelf => (
              <TabsTrigger 
                key={bookshelf.id} 
                value={bookshelf.id.toString()}
                className="flex-1"
              >
                {bookshelf.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {familyBookshelves.map(bookshelf => (
            <TabsContent key={bookshelf.id} value={bookshelf.id.toString()}>
              {isLoadingBooks ? (
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
              ) : books ? (
                <Bookshelf 
                  numShelves={bookshelf.numShelves || 2} 
                  books={books.filter(b => b.bookshelfId === bookshelf.id)}
                  onAddBook={handleAddBook}
                  onAddShelf={handleAddShelf}
                />
              ) : null}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center py-12">
          <p className="text-gray-500 mb-4">{t('familyBookshelf.noBookshelfFound')}</p>
          <Button>
            {t('familyBookshelf.createBookshelf')}
          </Button>
        </div>
      )}

      <div className="mt-8">
        <h2 className="font-heading text-xl font-bold mb-4">{t('familyBookshelf.familyMembers')}</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {['张家豪', '张丽娜', '张伟', '小明'].map((member) => (
            <div key={member} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member)}&background=random`} 
                  alt={member} 
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div>
                  <h3 className="font-heading">{member}</h3>
                  <span className="text-gray-500 text-sm">
                    {Math.floor(Math.random() * 50)} {t('familyBookshelf.books')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
