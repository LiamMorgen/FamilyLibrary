import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Bookshelf as BookshelfType, ShelfPosition } from "@/lib/types";
import { Bookshelf } from "@/components/ui/bookshelf";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { CreateBookshelfDialog } from "@/components/bookshelf/CreateBookshelfDialog";
import { apiRequest } from "@/lib/queryClient";
import { useNavigate } from "react-router-dom";
import type { Book } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTabBookshelfId, setActiveTabBookshelfId] = useState<number | null>(null);

  // 获取个人书架列表
  const { data: myBookshelves, isLoading: isLoadingBookshelves, error: bookshelvesError } = useQuery<BookshelfType[], Error>({
    queryKey: ['/api/bookshelves/owner/current'],
    queryFn: fetchMyBookshelves,
  });

  // 设置第一个书架为默认选中
  useEffect(() => {
    if (myBookshelves && myBookshelves.length > 0 && activeTabBookshelfId === null) {
      console.log("默认选中个人书架:", myBookshelves[0].id);
      setActiveTabBookshelfId(myBookshelves[0].id);
    }
  }, [myBookshelves, activeTabBookshelfId]);

  // 获取当前激活书架的信息
  const activeBookshelf = myBookshelves?.find(bs => bs.id === activeTabBookshelfId);

  // 查询当前激活书架的书籍
  const { data: booksForActiveBookshelf, isLoading: isLoadingBooks, error: booksError } = useQuery<Book[], Error>({
    queryKey: ['/api/books', { bookshelfId: activeBookshelf?.id }],
    queryFn: () => fetchBooksForBookshelf(activeBookshelf?.id),
    enabled: !!activeBookshelf, // 只有当有激活书架时才执行查询
  });

  const handleCreateBookshelf = () => {
    setIsCreateDialogOpen(true);
  };

  const handleBookshelfCreated = (newBookshelf: BookshelfType) => {
    console.log("新的个人书架已创建:", newBookshelf);
    queryClient.invalidateQueries({ queryKey: ['/api/bookshelves/owner/current'] });
    setIsCreateDialogOpen(false);
    // 自动选择新创建的书架
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
        <Skeleton className="h-10 w-full mb-4" /> {/* 用于TabsList */}
        <Skeleton className="h-[300px] w-full" /> {/* 用于TabsContent */}
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
          {myBookshelves.map((shelf) => (
            <TabsTrigger key={shelf.id} value={shelf.id.toString()}>
              {shelf.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {myBookshelves.map((shelf) => (
          <TabsContent key={shelf.id} value={shelf.id.toString()}>
            {activeBookshelf && activeBookshelf.id === shelf.id ? (
              isLoadingBooks ? (
                <Skeleton className="h-[300px] w-full" />
              ) : booksError ? (
                <div className="text-red-500">{t('myBookshelf.loadBooksError')}: {booksError.message}</div>
              ) : (
                <Bookshelf
                  numShelves={activeBookshelf.numShelves || 1}
                  books={booksForActiveBookshelf || []}
                  onAddBook={handleAddBookToShelf}
                />
              )
            ) : (
              <div>{t('myBookshelf.selectTabToView', { name: shelf.name, defaultValue: `选择"${shelf.name}"查看书籍` })}</div>
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
    </div>
  );
}
