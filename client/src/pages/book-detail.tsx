import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDate, getBookCoverPlaceholder } from "@/lib/utils";
import type { User, BookLending } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

// 书籍类型定义
interface BookDetail {
  id: number;
  title: string;
  author: string;
  isbn: string | null;
  publisher: string | null;
  publicationDate: string | null;
  genre: string | null;
  summary: string | null;
  coverImageUrl: string | null;
  status: string;
  bookshelfId: number;
  bookshelfName: string;
  shelfPosition: {
    shelf: number;
    position: number;
  };
  addedDate: string;
  addedBy: {
    id: number;
    username: string;
    displayName?: string;
  };
  totalPages: number | null;
  language: string | null;
  coverImage?: string;
  currentLendingId?: number;
  currentBorrower?: {
    id: number;
  };
}

export default function BookDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { bookId } = useParams<{ bookId: string }>();

  const { data: currentUser } = useQuery<User>({ queryKey: ['/api/users/current'] });

  // @ts-ignore
  const { data: book, isLoading, error, refetch: refetchBookDetails } = useQuery<BookDetail, Error>({
    queryKey: ['/api/books', bookId],
    queryFn: async () => {
      if (!bookId) throw new Error('Book ID is required');
      const response = await apiRequest('GET', `/api/books/${bookId}`);
      if (!response.ok) throw new Error('Failed to fetch book details');
      return response.json();
    },
    enabled: !!bookId,
  });

  const borrowMutation = useMutation<BookLending, Error, { bookId: number; lenderId: number; borrowerId: number; dueDate?: string }>({
    mutationFn: async (newLending) => {
      const response = await apiRequest("POST", "/api/book-lendings", newLending);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t('bookDetail.borrowSuccessTitle'), description: t('bookDetail.borrowSuccessDesc') });
      queryClient.invalidateQueries({ queryKey: ['/api/books', bookId] });
      queryClient.invalidateQueries({ queryKey: ['/api/book-lendings/my-active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/book-lendings/my-active/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
    },
    onError: (error) => {
      toast({ title: t('bookDetail.borrowErrorTitle'), description: error.message || t('bookDetail.borrowErrorDesc'), variant: "destructive" });
    },
  });

  const returnMutation = useMutation<BookLending, Error, { lendingId: number }>({
    mutationFn: async ({ lendingId }) => {
      const response = await apiRequest("PATCH", `/api/book-lendings/${lendingId}/return`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t('bookDetail.returnSuccessTitle'), description: t('bookDetail.returnSuccessDesc') });
      queryClient.invalidateQueries({ queryKey: ['/api/books', bookId] });
      queryClient.invalidateQueries({ queryKey: ['/api/book-lendings/my-active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/book-lendings/my-active/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
    },
    onError: (error) => {
      toast({ title: t('bookDetail.returnErrorTitle'), description: error.message || t('bookDetail.returnErrorDesc'), variant: "destructive" });
    },
  });

  const handleBorrowBook = () => {
    if (!book || !currentUser || !book.addedBy) return;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    borrowMutation.mutate({
      bookId: book.id,
      lenderId: book.addedBy.id,
      borrowerId: currentUser.id,
      dueDate: dueDate.toISOString(),
    });
  };

  const handleReturnBook = () => {
    if (!book || !book.currentLendingId) return;
    returnMutation.mutate({ lendingId: book.currentLendingId });
  };
  
  // 如果API尚未实现，这里添加一个模拟数据
  const [mockBook, setMockBook] = useState<BookDetail | null>(null);
  
  useEffect(() => {
    // 如果API调用失败（API可能未实现），使用模拟数据
    if (error && bookId && !book) {
      console.warn("API调用失败，使用模拟数据 for book detail", error);
      setMockBook({
        id: parseInt(bookId),
        title: "示例书名",
        author: "示例作者",
        isbn: "9787XXXXXXXXX",
        publisher: "示例出版社",
        publicationDate: "2023-01-01",
        genre: "小说",
        summary: "这是一本示例书籍的详细描述。在实际应用中，这里会显示书籍的简介或摘要内容。",
        coverImageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=300",
        status: "available",
        bookshelfId: 1,
        bookshelfName: "我的书架",
        shelfPosition: {
          shelf: 0,
          position: 0,
        },
        addedDate: new Date().toISOString(),
        addedBy: {
          id: 1,
          username: "admin",
        },
        totalPages: 300,
        language: "中文",
      });
    }
  }, [error, bookId, book]);

  // 获取要显示的书籍（API数据或模拟数据）
  const displayBook = book || mockBook;

  // Determine if the borrow button should be shown
  const canBorrow = displayBook && 
                    currentUser && 
                    displayBook.status === 'available' && 
                    displayBook.addedBy?.id !== currentUser.id;

  const canReturn = displayBook && currentUser && 
                    displayBook.status === 'BORROWED' && // Status from backend for Book
                    displayBook.currentLendingId && 
                    displayBook.currentBorrower?.id === currentUser.id;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left mr-2"></i>
            {t('back')}
          </Button>
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96 w-full" />
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-8 w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!displayBook) {
    return (
      <div className="container mx-auto p-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left mr-2"></i>
          {t('back')}
        </Button>
        <p className="mt-8 text-center text-red-500">
          {t('bookDetail.notFound', { defaultValue: '未找到书籍信息' })}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left mr-2"></i>
          {t('back', { defaultValue: '返回' })}
        </Button>
        <h1 className="text-2xl font-bold">{t('bookDetail.title', { defaultValue: '书籍详情' })}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 书籍封面和基本信息 */}
        <div>
          <Card>
            <CardContent className="pt-6 flex flex-col items-center">
              <img 
                src={displayBook.coverImageUrl || displayBook.coverImage || getBookCoverPlaceholder()} 
                alt={displayBook.title} 
                className="max-w-full h-auto rounded shadow-md mb-4"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = getBookCoverPlaceholder();
                }}
              />
              <div className="w-full">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">{t('bookDetail.status', { defaultValue: '状态' })}:</span>
                  <Badge variant={displayBook.status === 'available' ? 'secondary' : 'default'}>
                    {t(`bookStatus.${displayBook.status}`, { defaultValue: displayBook.status })}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">{t('bookDetail.location', { defaultValue: '位置' })}:</span>
                  <span className="text-sm font-medium">
                    {displayBook.bookshelfName}, {t('bookDetail.shelf', { defaultValue: '层' })} {displayBook.shelfPosition.shelf + 1}, 
                    {t('bookDetail.position', { defaultValue: '位置' })} {displayBook.shelfPosition.position + 1}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('bookDetail.addedOn', { defaultValue: '添加日期' })}:</span>
                  <span className="text-sm">{formatDate(new Date(displayBook.addedDate))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 书籍详细信息 */}
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{displayBook.title}</CardTitle>
              <p className="text-lg text-gray-700">{displayBook.author}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {displayBook.genre && (
                <Badge variant="outline" className="mb-2">
                  {displayBook.genre}
                </Badge>
              )}

              {displayBook.summary && (
                <div>
                  <h3 className="text-md font-semibold mb-2">{t('bookDetail.summary', { defaultValue: '简介' })}</h3>
                  <p className="text-gray-700 whitespace-pre-line">{displayBook.summary}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-4">
                {displayBook.isbn && (
                  <div>
                    <span className="text-sm text-gray-600">{t('bookDetail.isbn', { defaultValue: 'ISBN' })}:</span>
                    <span className="text-sm ml-2">{displayBook.isbn}</span>
                  </div>
                )}
                
                {displayBook.publisher && (
                  <div>
                    <span className="text-sm text-gray-600">{t('bookDetail.publisher', { defaultValue: '出版社' })}:</span>
                    <span className="text-sm ml-2">{displayBook.publisher}</span>
                  </div>
                )}
                
                {displayBook.publicationDate && (
                  <div>
                    <span className="text-sm text-gray-600">{t('bookDetail.publicationDate', { defaultValue: '出版日期' })}:</span>
                    <span className="text-sm ml-2">{formatDate(new Date(displayBook.publicationDate))}</span>
                  </div>
                )}
                
                {displayBook.totalPages && (
                  <div>
                    <span className="text-sm text-gray-600">{t('bookDetail.pages', { defaultValue: '页数' })}:</span>
                    <span className="text-sm ml-2">{displayBook.totalPages}</span>
                  </div>
                )}
                
                {displayBook.language && (
                  <div>
                    <span className="text-sm text-gray-600">{t('bookDetail.language', { defaultValue: '语言' })}:</span>
                    <span className="text-sm ml-2">{displayBook.language}</span>
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4 mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <Button variant="outline" onClick={() => alert('Edit action placeholder')} disabled={borrowMutation.isPending || returnMutation.isPending}>
                    <i className="fas fa-edit mr-2"></i>
                    {t('bookDetail.edit')}
                  </Button>

                  {canBorrow && (
                    <Button onClick={handleBorrowBook} disabled={borrowMutation.isPending}>
                      <i className={`fas ${borrowMutation.isPending ? 'fa-spinner fa-spin' : 'fa-hand-holding-heart'} mr-2`}></i>
                      {borrowMutation.isPending ? t('bookDetail.borrowing') : t('bookDetail.borrow')}
                    </Button>
                  )}

                  {canReturn && (
                    <Button onClick={handleReturnBook} disabled={returnMutation.isPending} variant="secondary">
                      <i className={`fas ${returnMutation.isPending ? 'fa-spinner fa-spin' : 'fa-undo-alt'} mr-2`}></i>
                      {returnMutation.isPending ? t('bookDetail.returning') : t('bookDetail.return')}
                    </Button>
                  )}
                  
                  <Button variant="outline" className="text-red-500 hover:text-red-700" onClick={() => alert('Delete action placeholder')} disabled={borrowMutation.isPending || returnMutation.isPending}>
                    <i className="fas fa-trash mr-2"></i>
                    {t('bookDetail.delete')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 