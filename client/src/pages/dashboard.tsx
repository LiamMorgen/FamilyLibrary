import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// @ts-ignore
import { Bookshelf as UIShelf } from "@/components/ui/bookshelf";
// @ts-ignore
import { BookCard } from "@/components/ui/book-card";
import ActivityFeed from "@/components/activity-feed";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
// @ts-ignore
import type { Book, Activity, User, ShelfPosition, Bookshelf } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, getBookCoverPlaceholder } from "@/lib/utils";

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

  // Fetch all bookshelves
  // @ts-ignore
  const { data: allBookshelves, isLoading: isLoadingAllBookshelves } = useQuery<Bookshelf[]>({
    queryKey: ['/api/bookshelves'],
  });

  // Fetch personal bookshelves
  const { data: personalBookshelves, isLoading: isLoadingPersonalBookshelves } = useQuery<Bookshelf[]>({
    queryKey: ['/api/bookshelves/owner/current'],
  });

  // Fetch family bookshelves
  const { data: familyBookshelves, isLoading: isLoadingFamilyBookshelves } = useQuery<Bookshelf[]>({
    queryKey: ['/api/bookshelves/family/current'],
  });

  // Fetch books for all bookshelves
  const { data: allBooks, isLoading: isLoadingBooks } = useQuery<Book[]>({
    queryKey: ['/api/books'],
  });

  // Fetch recent activities
  const { data: activities, isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: ['/api/activities', { limit: 5 }],
  });

  // Fetch recent books - 只保留最近4本书
  const { data: recentBooks, isLoading: isLoadingRecentBooks } = useQuery<Book[]>({
    queryKey: ['/api/books', { limit: 4, sort: 'addedDate_desc' }], // 按添加日期排序，最新添加的排在前面
  });

  // 处理后端返回的数据，确保addedById字段存在
  const processedBooks = allBooks?.map(book => ({
    ...book,
    // 如果addedById不存在但addedBy存在，则从addedBy中提取ID，否则提供默认值0
    addedById: book.addedById || book.addedBy?.id || 0,
    // 确保coverImage字段存在
    coverImage: book.coverImage || book.coverImageUrl
  })) || [];

  console.log("处理后的书籍数据:", processedBooks);

  // 按照书架ID对书籍进行分组 - 使用处理后的数据
  const booksByBookshelfId = processedBooks.reduce((acc, book) => {
    if (!acc[book.bookshelfId]) {
      acc[book.bookshelfId] = [];
    }
    acc[book.bookshelfId].push(book);
    return acc;
  }, {} as Record<number, Book[]>);

  // 在dashboard.tsx中添加调试信息
  console.log("当前用户ID:", currentUser?.id);
  console.log("个人书架:", personalBookshelves);
  console.log("所有书籍:", allBooks);

  // 显示一本书的完整属性以检查字段名
  console.log("第一本书的完整属性:", allBooks?.[0]);

  // 增强过滤逻辑，添加更多调试信息
  const personalBooks = processedBooks.filter(book => {
    console.log("书籍信息:", {
      title: book.title,
      addedById: book.addedById,
      currentUserId: currentUser?.id
    });
    
    // 检查当前登录用户ID与书籍的addedById是否匹配
    const isUserBook = book.addedById === currentUser?.id;
    console.log(`${book.title} 是否为当前用户书籍: ${isUserBook}`);
    return isUserBook;
  });

  console.log("统计的个人书籍:", personalBooks.length, personalBooks);
  
  const totalBooks = personalBooks.length;
  const readingBooks = personalBooks.filter(b => b.status === 'reading').length;
  const borrowedBooks = personalBooks.filter(b => b.status === 'borrowed').length;
  
  // 获取待归还的书籍（借出且已过期的书籍）
  const pendingReturnBooks = personalBooks.filter(book => {
    // 检查借阅状态并获取过期日期（如果存在）
    return book.status === 'borrowed' && 
           ((book as any).dueDate && new Date((book as any).dueDate) < new Date());
  }).length || 0;

  // 处理加载中和错误状态
  // @ts-ignore
  const isLoading = isLoadingAllBookshelves || isLoadingBooks || isLoadingRecentBooks || isLoadingActivities;

  // 获取书架的前5本书
  const getPreviewBooks = (bookshelfId: number) => {
    const books = booksByBookshelfId[bookshelfId] || [];
    return books.slice(0, 5);
  };

  // 处理"查看全部"跳转
  const handleViewAll = (bookshelf: Bookshelf) => {
    return bookshelf.familyId ? "/family-bookshelf" : "/my-bookshelf";
  };

  // 渲染单个书架
  const renderBookshelf = (bookshelf: Bookshelf) => {
    const previewBooks = getPreviewBooks(bookshelf.id);
    const viewAllLink = handleViewAll(bookshelf);
    
    return (
      <div key={bookshelf.id} className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-lg">{bookshelf.name} ({bookshelf.familyId ? t('bookshelves.family') : t('bookshelves.personal')})</h3>
          <Link href={viewAllLink}>
            <Button variant="ghost" size="sm">{t('dashboard.viewAll')}</Button>
          </Link>
        </div>
        
        {isLoadingBooks ? (
          <Skeleton className="h-[200px] w-full" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 min-h-[160px]">
            {previewBooks.length > 0 ? (
              <>
                {previewBooks.map((book) => (
                  <Link key={book.id} href={`/books/${book.id}`}>
                    <div className="book-card">
                      <img 
                        src={book.coverImage || book.coverImageUrl || getBookCoverPlaceholder()} 
                        alt={book.title} 
                        className="h-24 w-full object-cover rounded shadow-sm mb-1"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = getBookCoverPlaceholder();
                        }}
                      />
                      <p className="text-xs font-semibold text-gray-700 truncate w-full px-1" title={book.title}>
                        {book.title}
                      </p>
                    </div>
                  </Link>
                ))}
              </>
            ) : (
              <div className="col-span-2 md:col-span-4 lg:col-span-5 flex flex-col items-center justify-center py-6 bg-gray-50 rounded-lg">
                <i className="fas fa-book text-gray-300 text-3xl mb-2"></i>
                <p className="text-gray-500 mb-4">{t('dashboard.noBooks', '书架暂无书籍')}</p>
                <Link href={`/add-book?bookshelfId=${bookshelf.id}&source=${bookshelf.familyId ? 'family-bookshelf' : 'my-bookshelf'}`}>
                  <Button size="sm">
                    <i className="fas fa-plus mr-2"></i>
                    {t('dashboard.addFirstBook')}
                  </Button>
                </Link>
              </div>
            )}
            
            {/* 如果有书籍但少于5本，显示添加按钮 */}
            {previewBooks.length > 0 && previewBooks.length < 5 && (
              <Link href={`/add-book?bookshelfId=${bookshelf.id}&source=${bookshelf.familyId ? 'family-bookshelf' : 'my-bookshelf'}`}>
                <div className="cursor-pointer flex items-center justify-center h-32 border-2 border-dashed border-gray-300 p-4 rounded-lg hover:border-primary">
                  <div className="text-center">
                    <i className="fas fa-plus text-2xl text-gray-400 mb-2"></i>
                    <p className="text-sm text-gray-500">{t('dashboard.addBook')}</p>
                  </div>
                </div>
              </Link>
            )}
          </div>
        )}
      </div>
    );
  };

  // 在后续代码中添加强制执行的检查
  console.log("所有书籍是否加载:", !!allBooks, "书籍数量:", allBooks?.length || 0);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{t('dashboard.welcome', { name: currentUser?.username || '' })}</h1>
        <p className="text-gray-500">{t('dashboard.todayDate', { date: formatDate(new Date()) })}</p>
      </div>
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <i className="fas fa-book text-blue-600 text-xl"></i>
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
              <div className="p-2 bg-purple-100 rounded-lg">
                <i className="fas fa-glasses text-purple-600 text-xl"></i>
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

      {/* 分为两栏的布局：左侧书架列表，右侧活动和最近添加 */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 书架部分 */}
        <div className="lg:w-2/3">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.bookshelves')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="family">
                <TabsList className="mb-4">
                  <TabsTrigger value="family">{t('dashboard.familyBookshelves')}</TabsTrigger>
                  <TabsTrigger value="personal">{t('dashboard.personalBookshelves')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="family">
                  {isLoadingFamilyBookshelves ? (
                    <Skeleton className="h-[200px] w-full" />
                  ) : !familyBookshelves || familyBookshelves.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 mb-4">{t('dashboard.noFamilyBookshelves')}</p>
                      <Link href="/family-bookshelf">
                        <Button>{t('dashboard.createFamilyBookshelf')}</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {familyBookshelves.map(renderBookshelf)}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="personal">
                  {isLoadingPersonalBookshelves ? (
                    <Skeleton className="h-[200px] w-full" />
                  ) : !personalBookshelves || personalBookshelves.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 mb-4">{t('dashboard.noPersonalBookshelves')}</p>
                      <Link href="/my-bookshelf">
                        <Button>{t('dashboard.createPersonalBookshelf')}</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {personalBookshelves.map(renderBookshelf)}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* 右侧部分：最近添加的书和活动日志 */}
        <div className="lg:w-1/3">
          {/* 最近添加的书籍 */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t('dashboard.recentlyAdded')}</CardTitle>
                <Link href="/my-bookshelf">
                  <Button variant="ghost" size="sm">{t('dashboard.viewAll')}</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingRecentBooks ? (
                <div className="space-y-4">
                  <Skeleton className="h-[80px] w-full" />
                  <Skeleton className="h-[80px] w-full" />
                  <Skeleton className="h-[80px] w-full" />
                </div>
              ) : !recentBooks || recentBooks.length === 0 ? (
                <p className="text-center text-gray-500 py-4">{t('dashboard.noRecentBooks')}</p>
              ) : (
                <div className="space-y-4">
                  {recentBooks.map((book) => (
                    <Link key={book.id} href={`/books/${book.id}`}>
                      <div className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <img 
                          src={book.coverImage || book.coverImageUrl || getBookCoverPlaceholder()} 
                          alt={book.title} 
                          className="w-12 h-16 object-cover rounded mr-3"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = getBookCoverPlaceholder();
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{book.title}</h4>
                          <p className="text-xs text-gray-500">{book.author}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(new Date(book.addedDate))}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* 活动日志 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.recentActivities')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingActivities ? (
                <div className="space-y-4">
                  <Skeleton className="h-[30px] w-full" />
                  <Skeleton className="h-[30px] w-full" />
                  <Skeleton className="h-[30px] w-full" />
                </div>
              ) : !activities || activities.length === 0 ? (
                <p className="text-center text-gray-500 py-4">{t('dashboard.noActivities')}</p>
              ) : (
                <ActivityFeed activities={activities} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
