import { useEffect, useState, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
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
import type { Book, Activity, User, ShelfPosition, Bookshelf, AIMessage, AIQuery, InitialAIAnalysisResponse, BookLending } from "@/lib/types";
import { apiRequest, fetchInitialAIAnalysis, postAIChatMessage, fetchMyActiveLendings, fetchMyActiveLendingsCount } from "@/lib/queryClient";
import { formatDate, getBookCoverPlaceholder } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Dashboard() {
  const { t } = useTranslation();
  
  // AI Chat State
  const [isAIAnalysisLoading, setIsAIAnalysisLoading] = useState(true); 
  // @ts-ignore
  const [aiAnalysisError, setAIAnalysisError] = useState<string | null>(null); 
  const [chatHistory, setChatHistory] = useState<AIMessage[]>([
    { role: "assistant", content: t('dashboard.aiChatInitialWelcome', 'AI助手正在启动，请稍候...') }
  ]);
  const [userChatInput, setUserChatInput] = useState("");
  const [isAIChatLoading, setIsAIChatLoading] = useState(false); 
  const chatScrollAreaRef = useRef<HTMLDivElement>(null);
  const [showAllRecentBooks, setShowAllRecentBooks] = useState(false); // State for recent books toggle

  // Data Fetching Hooks
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/users/current'],
  });

  // @ts-ignore
  const { data: allBookshelves, isLoading: isLoadingAllBookshelves } = useQuery<Bookshelf[]>({ 
    queryKey: ['/api/bookshelves'], 
    enabled: !!currentUser 
  });
  const { data: personalBookshelves, isLoading: isLoadingPersonalBookshelves } = useQuery<Bookshelf[]>({ 
    queryKey: ['/api/bookshelves/owner/current'], 
    enabled: !!currentUser 
  });
  const { data: familyBookshelves, isLoading: isLoadingFamilyBookshelves } = useQuery<Bookshelf[]>({ 
    queryKey: ['/api/bookshelves/family/current'], 
    enabled: !!currentUser 
  });
  const { data: allBooks, isLoading: isLoadingBooks } = useQuery<Book[]>({ 
    queryKey: ['/api/books'], 
    enabled: !!currentUser 
  });
  const { data: activities, isLoading: isLoadingActivities } = useQuery<Activity[]>({ 
    queryKey: ['/api/activities', { limit: 5 }], 
    enabled: !!currentUser 
  });
  const { data: allRecentBooks, isLoading: isLoadingRecentBooks } = useQuery<Book[]>({
    queryKey: ['/api/books', { limit: 15, sort: 'addedDate_desc' }], // Fetch more for potential expansion
    enabled: !!currentUser
  });
  const { data: myActiveLendings, isLoading: isLoadingMyActiveLendings } = useQuery<BookLending[]>({
    queryKey: ['/api/book-lendings/my-active'],
    queryFn: fetchMyActiveLendings,
    enabled: !!currentUser,
  });
  const { data: myActiveLendingsCount, isLoading: isLoadingMyActiveLendingsCount } = useQuery<number>({
    queryKey: ['/api/book-lendings/my-active/count'],
    queryFn: fetchMyActiveLendingsCount,
    enabled: !!currentUser,
  });

  // useEffect for sample data init (runs once)
  useEffect(() => {
    const initSampleData = async () => {
      try { await apiRequest("POST", "/api/init-sample-data", {}); }
      catch (error) { console.error("Failed to initialize sample data:", error); }
    };
    if (currentUser) { // Only init sample data if a user is identified, to avoid potential issues
        initSampleData();
    }
  }, [currentUser]); // Depend on currentUser to ensure it runs after user context is available

  // useEffect for Initial AI Chat Message
  useEffect(() => {
    let newOpeningMessage: AIMessage; // Declare here to ensure it's in scope for finally block
    const fetchAndSetAnalysis = async () => {
      if (!currentUser) return; // Don't fetch if no user
      setIsAIAnalysisLoading(true);
      setAIAnalysisError(null);
      try {
        const analysisData: InitialAIAnalysisResponse = await fetchInitialAIAnalysis();
        if (analysisData && analysisData.analysisText) {
          newOpeningMessage = { role: "assistant", content: analysisData.analysisText };
        } else {
          newOpeningMessage = { role: "assistant", content: t('dashboard.aiDefaultWelcome', '你好！开始您的阅读对话吧。') };
        }
      } catch (error: any) {
        console.error("Failed to fetch initial AI analysis for chat:", error);
        setAIAnalysisError(error.message || "获取AI分析失败，请稍后重试。");
        newOpeningMessage = { role: "assistant", content: t('dashboard.aiChatErrorFallback', '抱歉，AI助手初始化失败，您可以直接开始提问。') };
      } finally {
        setIsAIAnalysisLoading(false);
        setChatHistory([newOpeningMessage]); 
      }
    };
    const timer = setTimeout(() => { fetchAndSetAnalysis(); }, 700);
    return () => clearTimeout(timer); 
  }, [currentUser, t]); // Add t to dependency array of useEffect if it's used inside

  // useEffect to scroll chat
  useEffect(() => {
    if (chatScrollAreaRef.current) {
      chatScrollAreaRef.current.scrollTo({ top: chatScrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory]);

  // Processed Books (Memoized)
  const processedBooks = useMemo(() => 
    allBooks?.map(book => ({
      ...book,
      addedById: book.addedById || book.addedBy?.id || 0,
      coverImage: book.coverImage || book.coverImageUrl
    })) || [],
  [allBooks]);

  const booksByBookshelfId = useMemo(() => 
    processedBooks.reduce((acc, book) => {
      if (!acc[book.bookshelfId]) acc[book.bookshelfId] = [];
      acc[book.bookshelfId].push(book);
      return acc;
    }, {} as Record<number, Book[]>),
  [processedBooks]);
  
  const personalBooks = useMemo(() => 
    processedBooks.filter(book => book.addedById === currentUser?.id), 
  [processedBooks, currentUser]);

  // Stats Calculation (Memoized)
  const totalBooks = useMemo(() => personalBooks.length, [personalBooks]);
  const readingBooks = useMemo(() => personalBooks.filter(b => b.status === 'reading').length, [personalBooks]);
  const borrowedBooks = useMemo(() => myActiveLendingsCount || 0, [myActiveLendingsCount]);
  const pendingReturnBooks = useMemo(() => {
    if (!myActiveLendings) return 0;
    const now = new Date();
    return myActiveLendings.filter(lending => 
      lending.status === 'BORROWED' && lending.dueDate && new Date(lending.dueDate) < now
    ).length;
  }, [myActiveLendings]);

  // Fetch recent books - Now explicitly fetch more initially if needed, or rely on a separate "view all" page/modal
  // For this implementation, we'll fetch a decent number and slice for preview.
  const recentBooksToShow = useMemo(() => {
    if (!allRecentBooks) return [];
    return showAllRecentBooks ? allRecentBooks : allRecentBooks.slice(0, 5);
  }, [allRecentBooks, showAllRecentBooks]);

  // Chat Handler
  const handleSendChatMessage = async () => {
    if (!userChatInput.trim()) return;
    const newUserMessage: AIMessage = { role: "user", content: userChatInput.trim() };
    setChatHistory(prev => [...prev, newUserMessage]);
    const currentInput = userChatInput.trim();
    setUserChatInput("");
    setIsAIChatLoading(true);
    const payload: AIQuery = { query: currentInput, history: chatHistory.slice(-10) };
    try {
      const aiResponse = await postAIChatMessage(payload);
      setChatHistory(prev => [...prev, aiResponse]);
    } catch (error: any) {
      console.error("Failed to send chat message or get AI response:", error);
      setChatHistory(prev => [...prev, { role: "assistant", content: t('dashboard.aiChatError', '抱歉，AI对话暂时遇到问题。') }]);
    } finally {
      setIsAIChatLoading(false);
    }
  };
  
  // Overall Loading State
  // @ts-ignore
  const isLoading = isLoadingAllBookshelves || isLoadingBooks || isLoadingRecentBooks || isLoadingActivities || isLoadingMyActiveLendings || isLoadingMyActiveLendingsCount || isAIAnalysisLoading;

  // JSX Render function for bookshelves (as before)
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
          <Link to={viewAllLink}>
            <Button variant="ghost" size="sm">{t('dashboard.viewAll')}</Button>
          </Link>
        </div>
        
        {isLoadingBooks ? (
          <Skeleton className="h-[200px] w-full" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 min-h-[160px]">
            {previewBooks.length > 0 ? (
              <>
                {previewBooks.map((book) => {
                  // Enhanced log to see more details, especially for personal bookshelves
                  if (bookshelf.ownerId === currentUser?.id && !bookshelf.familyId) { // Heuristic for a personal bookshelf
                    console.log("Rendering PERSONAL bookshelf preview book:", 
                                { id: book.id, title: book.title, coverImage: book.coverImage, coverImageUrl: book.coverImageUrl });
                  } else {
                    console.log("Rendering preview book (other):", book.id, book.title);
                  }
                  return (
                    <Link key={`preview-${book.id}`} to={`/books/${book.id}`} className="block group focus:outline-none focus:ring-2 focus:ring-primary rounded-lg">
                      <div className="book-card flex flex-col items-center text-center p-2 rounded-lg border border-gray-200 group-hover:shadow-xl group-hover:border-primary transition-all h-full bg-white">
                        <img 
                          src={book.coverImage || book.coverImageUrl || getBookCoverPlaceholder()} 
                          alt={book.title} 
                          className="h-32 w-full object-cover rounded shadow-sm mb-2 group-hover:shadow-lg transition-shadow"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = getBookCoverPlaceholder();
                          }}
                        />
                        <p className="text-xs font-semibold text-gray-800 group-hover:text-primary-dark truncate w-full px-1 leading-tight" title={book.title}>
                          {book.title}
                        </p>
                        {book.author && (
                          <p className="text-xs text-gray-500 truncate w-full px-1 leading-tight">{book.author}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </>
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-6 bg-gray-50 rounded-lg min-h-[160px]">
                <i className="fas fa-book-reader text-gray-300 text-4xl mb-3"></i>
                <p className="text-gray-500 mb-3">{t('dashboard.noBooksInShelf', '这个书架还没有书籍')}</p>
                <Link to={`/add-book?bookshelfId=${bookshelf.id}&source=${bookshelf.familyId ? 'family-bookshelf' : 'my-bookshelf'}`}>
                  <Button size="sm">
                    <i className="fas fa-plus mr-2"></i>
                    {t('dashboard.addFirstBookToThisShelf', '添加第一本')}
                  </Button>
                </Link>
              </div>
            )}
            
            {previewBooks.length > 0 && previewBooks.length < 5 && (
              <Link to={`/add-book?bookshelfId=${bookshelf.id}&source=${bookshelf.familyId ? 'family-bookshelf' : 'my-bookshelf'}`} className="block">
                <div className="cursor-pointer flex flex-col items-center justify-center h-full min-h-[160px] border-2 border-dashed border-gray-300 p-4 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors">
                  <i className="fas fa-plus text-3xl text-gray-400 mb-2"></i>
                  <p className="text-sm text-gray-500">{t('dashboard.addBookToShelf', '添加到此书架')}</p>
                </div>
              </Link>
            )}
          </div>
        )}
      </div>
    );
  };

  // Debug Logs (keep them for now if helpful)
  console.log("Current User ID:", currentUser?.id);
  console.log("Personal Bookshelves:", personalBookshelves);
  console.log("All Books raw:", allBooks);
  console.log("Processed Books:", processedBooks);
  console.log("Personal Books (filtered):", personalBooks);
  console.log("My Active Lendings:", myActiveLendings);
  console.log("My Active Lendings Count:", myActiveLendingsCount);

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
                      <Link to="/family-bookshelf">
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
                      <Link to="/my-bookshelf">
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
        
        {/* 右侧部分：AI聊天、最近添加的书和活动日志 */}
        <div className="lg:w-1/3 space-y-6">
          {/* AI Chat Section */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-md font-semibold text-gray-800 flex items-center">
                <i className="fas fa-comments mr-2 text-blue-600"></i>
                {t('dashboard.aiChatTitle', '与AI聊聊您的阅读')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80 pr-3 mb-3" ref={chatScrollAreaRef}>
                <div className="space-y-3">
                  {chatHistory.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div 
                        className={`max-w-[80%] p-2.5 rounded-lg text-sm leading-relaxed 
                                    ${msg.role === 'user' 
                                      ? 'bg-blue-600 text-white rounded-br-none' 
                                      : 'bg-gray-100 text-gray-800 rounded-bl-none'}
                                    ${msg.role === 'assistant' && msg.content.includes('抱歉') ? 'border border-red-300 bg-red-50' : ''}
                                    `}
                      >
                        {msg.content.split('\n').map((paragraph, pIndex) => (
                          <p key={pIndex} className={pIndex > 0 ? "mt-1" : ""}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                  {isAIChatLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] p-2.5 rounded-lg text-sm bg-gray-100 text-gray-800 rounded-bl-none flex items-center">
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        {t('dashboard.aiThinking', 'AI思考中...')}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                <Textarea 
                  placeholder={t('dashboard.aiChatPlaceholder', '输入您想说的...')}
                  value={userChatInput}
                  onChange={(e) => setUserChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChatMessage();
                    }
                  }}
                  className="flex-grow resize-none h-12 text-sm p-2 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={1}
                />
                <Button onClick={handleSendChatMessage} disabled={isAIChatLoading || !userChatInput.trim()} className="h-12 px-4">
                  {isAIChatLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 最近添加的书籍 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('dashboard.recentlyAdded')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingRecentBooks ? (
                <div className="space-y-4">
                  <Skeleton className="h-[80px] w-full" />
                  <Skeleton className="h-[80px] w-full" />
                  <Skeleton className="h-[80px] w-full" />
                </div>
              ) : !allRecentBooks || allRecentBooks.length === 0 ? (
                <p className="text-center text-gray-500 py-4">{t('dashboard.noRecentBooks')}</p>
              ) : (
                <>
                  <div className="space-y-4">
                    {recentBooksToShow.map((book) => (
                      <Link key={book.id} to={`/books/${book.id}`}>
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
                  {allRecentBooks.length > 5 && (
                    <div className="mt-4 text-center">
                      <Button variant="link" onClick={() => setShowAllRecentBooks(!showAllRecentBooks)} className="text-sm">
                        {showAllRecentBooks ? t('dashboard.showLess', '收起') : t('dashboard.showAllRecent', '查看全部 ({{count}}本)', { count: allRecentBooks.length })}
                      </Button>
                    </div>
                  )}
                </>
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
