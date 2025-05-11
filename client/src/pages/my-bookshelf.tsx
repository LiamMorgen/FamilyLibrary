import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Bookshelf as BookshelfType, ShelfPosition } from "@/lib/types";
import { Bookshelf } from "@/components/ui/bookshelf";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { CreateBookshelfDialog } from "@/components/bookshelf/CreateBookshelfDialog";
import { apiRequest } from "@/lib/queryClient";
import { useNavigate } from "react-router-dom";
import type { Book } from "@/lib/types";

async function fetchMyBookshelves(): Promise<BookshelfType[]> {
  const response = await apiRequest('GET', '/api/bookshelves/owner/current');
  if (!response.ok) { 
    throw new Error('Network response was not ok for fetching bookshelves');
  }
  return response.json(); 
}

async function fetchBooksForBookshelf(bookshelfId: number | undefined | null): Promise<Book[]> {
  if (!bookshelfId) return []; 
  const response = await apiRequest('GET', `/api/books?bookshelfId=${bookshelfId}`);
  if (!response.ok) {
    throw new Error('Network response was not ok for fetching books');
  }
  return response.json();
}

export default function MyBookshelf() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: myBookshelves, isLoading: isLoadingBookshelves, error: bookshelvesError } = useQuery<BookshelfType[], Error>({
    queryKey: ['/api/bookshelves/owner/current'],
    queryFn: fetchMyBookshelves,
  });

  const myBookshelf = myBookshelves && myBookshelves.length > 0 ? myBookshelves[0] : null;

  const { data: books, isLoading: isLoadingBooks, error: booksError } = useQuery<Book[], Error>({
    queryKey: ['/api/books', { bookshelfId: myBookshelf?.id }],
    queryFn: () => fetchBooksForBookshelf(myBookshelf?.id),
    enabled: !!myBookshelf, 
  });

  if (isLoadingBookshelves) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (bookshelvesError) {
    return <div className="text-red-500 p-4">{t('myBookshelf.loadError')}: {bookshelvesError.message}</div>;
  }
  
  const handleAddBookToShelf = (shelfPosition: ShelfPosition) => {
    if (myBookshelf) {
      navigate(`/add-book?bookshelfId=${myBookshelf.id}&shelf=${shelfPosition.shelf}&position=${shelfPosition.position}`);
    } else {
      console.warn("No bookshelf available to add a book to.");
      setIsCreateDialogOpen(true);
    }
  };

  const handleCreateBookshelf = () => {
    setIsCreateDialogOpen(true);
  };

  const handleBookshelfCreated = (newBookshelf: BookshelfType) => {
    console.log("New bookshelf created:", newBookshelf);
    queryClient.invalidateQueries({ queryKey: ['/api/bookshelves/owner/current'] });
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('myBookshelf.title')}</h1>
        <Button onClick={handleCreateBookshelf} data-testid="create-my-bookshelf-button">
          {t('myBookshelf.createButton')}
        </Button>
      </div>

      {myBookshelf ? (
        isLoadingBooks ? (
          <Skeleton className="h-[300px] w-full" /> 
        ) : booksError ? (
          <div className="text-red-500">{t('myBookshelf.loadBooksError')}: {booksError.message}</div>
        ) : (
          <Bookshelf
            numShelves={myBookshelf.numShelves || 1} 
            books={books || []} 
            onAddBook={handleAddBookToShelf} 
          />
        )
      ) : (
        <div className="text-center py-10">
          <p className="mb-4">{t('myBookshelf.noBookshelf')}</p>
        </div>
      )}

      <CreateBookshelfDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        context="my-bookshelf"
        onSuccess={handleBookshelfCreated}
      />
    </div>
  );
}
