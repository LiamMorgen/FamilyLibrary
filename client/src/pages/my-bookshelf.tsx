import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import type { Bookshelf as BookshelfType, ShelfPosition, Book, User } from "@/lib/types";
import { Bookshelf } from "@/components/ui/bookshelf";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { CreateBookshelfDialog } from "@/components/bookshelf/CreateBookshelfDialog";
import { apiRequest } from "@/lib/queryClient";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

async function fetchMyBookshelves(): Promise<BookshelfType[]> {
  const response = await apiRequest('GET', '/api/bookshelves/owner/current');
  if (!response.ok) { 
    throw new Error('Network response was not ok for fetching bookshelves');
  }
  const bookshelves = await response.json();
  console.log("个人书架数据已加载:", bookshelves.length, "个书架");
  return bookshelves;
}

async function fetchBooksForBookshelf(bookshelfId: number | undefined | null): Promise<Book[]> {
  if (!bookshelfId) return []; 
  const response = await apiRequest('GET', `/api/books?bookshelfId=${bookshelfId}`);
  if (!response.ok) {
    throw new Error('Network response was not ok for fetching books');
  }
  const booksData: any[] = await response.json();
  return booksData.map(book => ({
    ...book,
    coverImage: book.coverImageUrl,
  }));
}

export default function MyBookshelf() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTabBookshelfId, setActiveTabBookshelfId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [shelfToDelete, setShelfToDelete] = useState<BookshelfType | null>(null);

  const { data: currentUser } = useQuery<User>({ queryKey: ['/api/users/current'] });

  const { data: myBookshelves, isLoading: isLoadingBookshelves, error: bookshelvesError, refetch: refetchMyBookshelves } = useQuery<BookshelfType[], Error>({
    queryKey: ['/api/bookshelves/owner/current'],
    queryFn: fetchMyBookshelves,
    enabled: !!currentUser,
  });

  useEffect(() => {
    if (myBookshelves && myBookshelves.length > 0 && activeTabBookshelfId === null) {
      console.log("默认选中个人书架:", myBookshelves[0].id);
      setActiveTabBookshelfId(myBookshelves[0].id);
    }
  }, [myBookshelves, activeTabBookshelfId]);

  const activeBookshelf = myBookshelves?.find(bs => bs.id === activeTabBookshelfId);

  const { data: booksForActiveBookshelf, isLoading: isLoadingBooks, error: booksError } = useQuery<Book[], Error>({
    queryKey: ['/api/books', { bookshelfId: activeBookshelf?.id }],
    queryFn: () => fetchBooksForBookshelf(activeBookshelf?.id),
    enabled: !!activeBookshelf,
  });

  const deleteBookshelfMutation = useMutation<void, Error, number>({
    mutationFn: async (bookshelfId: number) => {
      await apiRequest("DELETE", `/api/bookshelves/${bookshelfId}`);
    },
    onSuccess: (_, deletedShelfId) => {
      toast({ title: t('myBookshelf.deleteSuccessTitle'), description: t('myBookshelf.deleteSuccessDesc', { name: shelfToDelete?.name }) });
      refetchMyBookshelves();
      setIsDeleteDialogOpen(false);
      setShelfToDelete(null);
      if (activeTabBookshelfId === deletedShelfId) {
        const remainingShelves = myBookshelves?.filter(s => s.id !== deletedShelfId);
        setActiveTabBookshelfId(remainingShelves && remainingShelves.length > 0 ? remainingShelves[0].id : null);
      }
    },
    onError: (error) => {
      toast({ title: t('myBookshelf.deleteErrorTitle'), description: error.message || t('myBookshelf.deleteErrorDesc'), variant: "destructive" });
      setIsDeleteDialogOpen(false);
      setShelfToDelete(null);
    },
  });

  const handleDeleteBookshelfClick = (bookshelf: BookshelfType) => {
    setShelfToDelete(bookshelf);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteBookshelf = () => {
    if (shelfToDelete) {
      deleteBookshelfMutation.mutate(shelfToDelete.id);
    }
  };

  const handleCreateBookshelf = () => {
    setIsCreateDialogOpen(true);
  };

  const handleBookshelfCreated = (newBookshelf: BookshelfType) => {
    console.log("新的个人书架已创建:", newBookshelf);
    queryClient.invalidateQueries({ queryKey: ['/api/bookshelves/owner/current'] });
    setIsCreateDialogOpen(false);
    setActiveTabBookshelfId(newBookshelf.id);
  };

  const handleAddBookToShelf = (shelfPosition: ShelfPosition) => {
    if (activeBookshelf) {
      navigate(`/add-book?bookshelfId=${activeBookshelf.id}&shelf=${shelfPosition.shelf}&position=${shelfPosition.position}&source=my-bookshelf`);
    } else {
      console.warn("无可用书架添加书籍");
      setIsCreateDialogOpen(true);
    }
  };

  if (isLoadingBookshelves) {
    return (
      <div className="p-4">
        <Skeleton className="h-8 w-1/4 mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (bookshelvesError) {
    return <div className="text-red-500 p-4">{t('myBookshelf.loadError')}: {bookshelvesError.message}</div>;
  }

  if (!myBookshelves || myBookshelves.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t('myBookshelf.title')}</h1>
          <Button onClick={handleCreateBookshelf} data-testid="create-my-bookshelf-button">
            {t('myBookshelf.createBookshelf')}
          </Button>
        </div>
        <div className="text-center py-10 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-4">{t('myBookshelf.noBookshelf')}</h3>
          <p className="mb-6 text-gray-600">{t('myBookshelf.noBookshelfDescription', { defaultValue: '您当前没有个人书架。创建一个书架，开始管理您的图书！' })}</p>
          <Button onClick={handleCreateBookshelf} size="lg">
            <i className="fas fa-plus mr-2"></i> {t('myBookshelf.createFirstBookshelf', { defaultValue: '创建第一个书架' })}
          </Button>
        </div>
        <CreateBookshelfDialog
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          context="my-bookshelf"
          onSuccess={handleBookshelfCreated}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('myBookshelf.title')}</h1>
        <Button onClick={handleCreateBookshelf} data-testid="create-my-bookshelf-button">
          {t('myBookshelf.createBookshelf')}
        </Button>
      </div>

      <Tabs value={activeTabBookshelfId?.toString()} onValueChange={(val) => setActiveTabBookshelfId(Number(val))}>
        <TabsList className="mb-4">
          {myBookshelves?.map((shelf) => (
            <div key={shelf.id} className="flex items-center group">
              <TabsTrigger value={shelf.id.toString()} className="rounded-r-none group-hover:bg-muted/50">
                {shelf.name}
              </TabsTrigger>
              {currentUser && shelf.ownerId === currentUser.id && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-full px-2 rounded-l-none opacity-0 group-hover:opacity-100 transition-opacity border-l border-transparent group-hover:border-border"
                  onClick={() => handleDeleteBookshelfClick(shelf)}
                  disabled={deleteBookshelfMutation.isPending && shelfToDelete?.id === shelf.id}
                >
                  {deleteBookshelfMutation.isPending && shelfToDelete?.id === shelf.id 
                    ? <i className="fas fa-spinner fa-spin text-xs"></i> 
                    : <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />}
                </Button>
              )}
            </div>
          ))}
        </TabsList>

        {myBookshelves?.map((shelf) => (
          <TabsContent key={`content-${shelf.id}`} value={shelf.id.toString()}>
            {activeBookshelf && activeBookshelf.id === shelf.id ? (
              isLoadingBooks ? (
                <Skeleton className="h-[300px] w-full" />
              ) : booksError ? (
                <div className="text-red-500">{t('myBookshelf.loadBooksError')}: {booksError.message}</div>
              ) : (
                <Bookshelf
                  bookshelfId={activeBookshelf.id}
                  numShelves={activeBookshelf.numShelves || 1}
                  shelfNames={activeBookshelf.shelfNames}
                  books={booksForActiveBookshelf || []}
                  onAddBook={handleAddBookToShelf}
                />
              )
            ) : (
              <div>{t('myBookshelf.selectTabToView', { name: shelf.name })}</div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <CreateBookshelfDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        context="my-bookshelf"
        onSuccess={handleBookshelfCreated}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('myBookshelf.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('myBookshelf.deleteConfirmDesc', { name: shelfToDelete?.name || '' })}
              <br/>
              <strong className="text-destructive">{t('myBookshelf.deleteWarning')}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShelfToDelete(null)}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBookshelf} disabled={deleteBookshelfMutation.isPending} className="bg-destructive hover:bg-destructive/90">
              {deleteBookshelfMutation.isPending ? t('myBookshelf.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
