import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { ReadingHistory, Book, User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

export default function ReadingStats() {
  const { t } = useTranslation();

  // Fetch current user's reading history
  const { data: readingHistory, isLoading: isLoadingHistory } = useQuery<ReadingHistory[]>({
    queryKey: ['/api/reading-history', { userId: 'current' }],
  });

  // Fetch all books for reference
  const { data: allBooks } = useQuery<Book[]>({
    queryKey: ['/api/books'],
  });

  // Fetch family members for comparison
  const { data: familyMembers } = useQuery<User[]>({
    queryKey: ['/api/families/current/users'],
  });

  const getBookById = (bookId: number) => {
    return allBooks?.find(book => book.id === bookId);
  };

  // Prepare data for charts
  const prepareMonthlyReadingData = () => {
    if (!readingHistory) return [];

    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        month: date.toLocaleDateString('zh-CN', { month: 'short' }),
        timestamp: date.getTime(),
        count: 0
      };
    }).sort((a, b) => a.timestamp - b.timestamp);

    // Count books started reading in each month
    readingHistory.forEach(history => {
      const startDate = new Date(history.startDate);
      const monthIndex = months.findIndex(month => {
        const monthDate = new Date(month.timestamp);
        return startDate.getMonth() === monthDate.getMonth() && 
               startDate.getFullYear() === monthDate.getFullYear();
      });
      
      if (monthIndex >= 0) {
        months[monthIndex].count++;
      }
    });

    return months.map(({ month, count }) => ({ month, count }));
  };

  const prepareCategoryData = () => {
    if (!readingHistory || !allBooks) return [];
    
    const categories: Record<string, number> = {};
    
    readingHistory.forEach(history => {
      const book = getBookById(history.bookId);
      if (book?.category) {
        categories[book.category] = (categories[book.category] || 0) + 1;
      }
    });
    
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  };

  const prepareFamilyComparisonData = () => {
    if (!familyMembers) return [];
    
    // In a real app, we would fetch reading counts for each family member
    // For now, use random data
    return familyMembers.map(member => ({
      name: member.displayName,
      books: Math.floor(Math.random() * 30) + 5
    }));
  };

  const monthlyReadingData = prepareMonthlyReadingData();
  const categoryData = prepareCategoryData();
  const familyComparisonData = prepareFamilyComparisonData();

  // Chart colors based on theme
  const CHART_COLORS = ['#1B4965', '#62B6CB', '#BEE9E8', '#547DA6', '#3D7EA6'];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-primary mb-6">{t('readingStats.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center h-32">
            <h3 className="text-sm text-gray-500 mb-1">{t('readingStats.totalRead')}</h3>
            {isLoadingHistory ? (
              <Skeleton className="h-10 w-16" />
            ) : (
              <p className="text-4xl font-bold text-primary">{readingHistory?.length || 0}</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center h-32">
            <h3 className="text-sm text-gray-500 mb-1">{t('readingStats.currentlyReading')}</h3>
            {isLoadingHistory ? (
              <Skeleton className="h-10 w-16" />
            ) : (
              <p className="text-4xl font-bold text-secondary">
                {readingHistory?.filter(h => !h.endDate).length || 0}
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center h-32">
            <h3 className="text-sm text-gray-500 mb-1">{t('readingStats.averageRating')}</h3>
            {isLoadingHistory ? (
              <Skeleton className="h-10 w-16" />
            ) : (
              <p className="text-4xl font-bold text-accent">
                {readingHistory && readingHistory.filter(h => h.rating).length > 0 
                  ? (readingHistory.reduce((sum, h) => sum + (h.rating || 0), 0) / 
                    readingHistory.filter(h => h.rating).length).toFixed(1)
                  : "N/A"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monthly" className="mb-8">
        <TabsList>
          <TabsTrigger value="monthly">{t('readingStats.monthlyReading')}</TabsTrigger>
          <TabsTrigger value="categories">{t('readingStats.byCategory')}</TabsTrigger>
          <TabsTrigger value="family">{t('readingStats.familyComparison')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>{t('readingStats.monthlyReadingChart')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={monthlyReadingData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" name={t('readingStats.booksRead')} fill="#1B4965" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>{t('readingStats.categoriesChart')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="family">
          <Card>
            <CardHeader>
              <CardTitle>{t('readingStats.familyComparisonChart')}</CardTitle>
            </CardHeader>
            <CardContent>
              {!familyMembers ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={familyComparisonData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="books" name={t('readingStats.booksRead')} fill="#62B6CB" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <h2 className="font-heading text-xl font-bold mb-4">{t('readingStats.readingHistory')}</h2>
        
        {isLoadingHistory ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-16 w-12" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-40 mb-2" />
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : readingHistory && readingHistory.length > 0 ? (
          <div className="space-y-4">
            {readingHistory
              .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
              .map(history => {
                const book = getBookById(history.bookId);
                return (
                  <Card key={history.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {book?.coverImage && (
                          <img 
                            src={book.coverImage} 
                            alt={book.title} 
                            className="h-16 w-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <h3 className="font-heading font-bold">{book?.title || t('readingStats.unknownBook')}</h3>
                          <p className="text-sm text-gray-600">{book?.author || ''}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span>
                              {t('readingStats.startedOn')}: {formatDate(new Date(history.startDate))}
                            </span>
                            {history.endDate && (
                              <span>
                                {t('readingStats.finishedOn')}: {formatDate(new Date(history.endDate))}
                              </span>
                            )}
                            {history.rating && (
                              <span className="flex items-center">
                                {t('readingStats.rating')}: 
                                <span className="ml-1 text-yellow-500">
                                  {Array.from({ length: history.rating }).map((_, i) => (
                                    <i key={i} className="fas fa-star text-xs"></i>
                                  ))}
                                </span>
                              </span>
                            )}
                          </div>
                          {history.notes && (
                            <p className="mt-2 text-sm italic">"{history.notes}"</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-2">{t('readingStats.noHistory')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
