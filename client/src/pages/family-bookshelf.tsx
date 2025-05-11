import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Book, Bookshelf as BookshelfType, ShelfPosition } from "@/lib/types";
import { Bookshelf } from "@/components/ui/bookshelf";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { CreateBookshelfDialog } from "@/components/bookshelf/CreateBookshelfDialog";
import { apiRequest } from "@/lib/queryClient"; // Import apiRequest

// Function to fetch family bookshelves
async function fetchFamilyBookshelves(): Promise<BookshelfType[]> {
  // Assuming 'current' will be resolved by the backend to the current user's family ID(s)
  const response = await apiRequest('GET', '/api/bookshelves/family/current');
  if (!response.ok) {
    throw new Error('Network response was not ok for fetching family bookshelves');
  }
  const bookshelves = await response.json();
  console.log("Fetched family bookshelves:", bookshelves);
  return bookshelves;
}

// Function to fetch books for a specific bookshelf (can be reused from my-bookshelf or defined here)
async function fetchBooksForBookshelf(bookshelfId: number | undefined | null): Promise<Book[]> {
  if (!bookshelfId) return [];
  const response = await apiRequest('GET', `/api/books?bookshelfId=${bookshelfId}`);
  if (!response.ok) {
    throw new Error('Network response was not ok for fetching books');
  }
  const booksData: any[] = await response.json();
  return booksData.map(book => ({
    ...book,
    coverImage: book.coverImage || book.coverImageUrl,
    coverImageUrl: book.coverImageUrl || book.coverImage
  }));
}

export default function FamilyBookshelf() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTabBookshelfId, setActiveTabBookshelfId] = useState<number | null>(null);

  // Fetch family bookshelves
  const { data: familyBookshelves, isLoading: isLoadingBookshelves, error: bookshelvesError } = useQuery<BookshelfType[], Error>({
    queryKey: ['/api/bookshelves/family/current'], // Updated queryKey
    queryFn: fetchFamilyBookshelves,
  });

  // 日志输出获取到的书架信息
  useEffect(() => {
    if (familyBookshelves) {
      console.log("家庭书架数据已加载:", familyBookshelves.length, "个书架");
      familyBookshelves.forEach(shelf => {
        console.log(`书架ID: ${shelf.id}, 名称: ${shelf.name}, 家庭ID: ${shelf.familyId}`);
      });
    }
  }, [familyBookshelves]);

  // Set the first bookshelf as active by default if not already set
  useEffect(() => {
    if (familyBookshelves && familyBookshelves.length > 0 && activeTabBookshelfId === null) {
      console.log("设置默认激活的书架:", familyBookshelves[0].id);
      setActiveTabBookshelfId(familyBookshelves[0].id);
    }
  }, [familyBookshelves, activeTabBookshelfId]);

  // Find the currently active bookshelf object
  const activeBookshelf = familyBookshelves?.find(bs => bs.id === activeTabBookshelfId);

  // Fetch books for the active bookshelf
  const { data: booksForActiveBookshelf, isLoading: isLoadingBooks, error: booksError } = useQuery<Book[], Error>({
    queryKey: ['/api/books', { bookshelfId: activeBookshelf?.id }],
    queryFn: () => fetchBooksForBookshelf(activeBookshelf?.id),
    enabled: !!activeBookshelf, // Only run if there's an active bookshelf
  });

  const handleCreateBookshelf = () => {
    setIsCreateDialogOpen(true);
  };

  const handleBookshelfCreated = (newBookshelf: BookshelfType) => {
    console.log("New family bookshelf created:", newBookshelf);
    queryClient.invalidateQueries({ queryKey: ['/api/bookshelves/family/current'] }); // Updated queryKey
    setIsCreateDialogOpen(false);
    // Optionally, switch to the new bookshelf tab
    setActiveTabBookshelfId(newBookshelf.id);
  };

  const handleAddBookToFamilyShelf = (shelfPosition: ShelfPosition) => {
    if (activeBookshelf) {
      navigate(`/add-book?bookshelfId=${activeBookshelf.id}&shelf=${shelfPosition.shelf}&position=${shelfPosition.position}&source=family-bookshelf`);
    } else {
      console.warn("No active family bookshelf to add a book to.");
      // Potentially show a message or guide user
    }
  };

  if (isLoadingBookshelves) {
    return (
      <div className="p-4">
        <Skeleton className="h-8 w-1/4 mb-4" />
        <Skeleton className="h-10 w-full mb-4" /> {/* For TabsList */}
        <Skeleton className="h-[300px] w-full" /> {/* For TabsContent */}
      </div>
    );
  }

  if (bookshelvesError) {
    return <div className="text-red-500 p-4">{t('familyBookshelf.loadError')}: {bookshelvesError.message}</div>;
  }

  if (!familyBookshelves || familyBookshelves.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t('familyBookshelf.title')}</h1>
          <Button onClick={handleCreateBookshelf} data-testid="create-family-bookshelf-button">
            {t('familyBookshelf.createButton')}
          </Button>
        </div>
        <div className="text-center py-10 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-4">{t('familyBookshelf.noBookshelves')}</h3>
          <p className="mb-6 text-gray-600">{t('familyBookshelf.noBookshelvesDescription', { defaultValue: '您目前没有家庭书架。创建一个家庭书架，与家人分享阅读体验！' })}</p>
          <Button onClick={handleCreateBookshelf} size="lg">
            <i className="fas fa-plus mr-2"></i> {t('familyBookshelf.createFirstBookshelf', { defaultValue: '创建第一个家庭书架' })}
          </Button>
        </div>
        <CreateBookshelfDialog
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          context="family-bookshelf"
          // defaultFamilyId can be passed if known, or determined in dialog based on user's families
          onSuccess={handleBookshelfCreated}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('familyBookshelf.title')}</h1>
        <Button onClick={handleCreateBookshelf} data-testid="create-family-bookshelf-button">
          {t('familyBookshelf.createButton')}
        </Button>
      </div>

      <Tabs value={activeTabBookshelfId?.toString()} onValueChange={(val) => setActiveTabBookshelfId(Number(val))}>
        <TabsList className="mb-4">
          {familyBookshelves.map((shelf) => (
            <TabsTrigger key={shelf.id} value={shelf.id.toString()}>
              {shelf.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {familyBookshelves.map((shelf) => (
          <TabsContent key={shelf.id} value={shelf.id.toString()}>
            {activeBookshelf && activeBookshelf.id === shelf.id ? (
              isLoadingBooks ? (
                <Skeleton className="h-[300px] w-full" />
              ) : booksError ? (
                <div className="text-red-500">{t('familyBookshelf.loadBooksError')}: {booksError.message}</div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mb-4">{activeBookshelf.name}</h2>
                  <Bookshelf
                    numShelves={activeBookshelf.numShelves || 1}
                    books={booksForActiveBookshelf || []}
                    onAddBook={handleAddBookToFamilyShelf}
                  />
                </>
              )
            ) : (
              <div>{t('familyBookshelf.selectTabToView', { name: shelf.name })}</div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <CreateBookshelfDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        context="family-bookshelf"
        // defaultFamilyId can be passed if known, or determined in dialog based on user's families
        onSuccess={handleBookshelfCreated}
      />
    </div>
  );
}
