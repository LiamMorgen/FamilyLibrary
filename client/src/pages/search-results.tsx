import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { Book } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { BookCard } from "@/components/ui/book-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

async function fetchSearchResults(query: string | null): Promise<Book[]> {
  if (!query) return [];
  const response = await apiRequest("GET", `/api/books?query=${encodeURIComponent(query)}`);
  return response.json();
}

export default function SearchResultsPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate(); // For back button
  const queryParams = new URLSearchParams(location.search);
  const searchTerm = queryParams.get("q");

  const { data: results, isLoading, error } = useQuery<Book[], Error>({
    queryKey: ['/api/books/search', searchTerm], // Use a distinct queryKey including the searchTerm
    queryFn: () => fetchSearchResults(searchTerm),
    enabled: !!searchTerm, // Only run query if searchTerm exists
  });

  return (
    <div className="container mx-auto p-4">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <i className="fas fa-arrow-left mr-2"></i>
        {t('common.back', "返回")}
      </Button>
      <h1 className="text-2xl font-bold mb-6">
        {t('searchResults.title', '搜索结果')}: <span className="text-primary">{searchTerm}</span>
      </h1>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-48 w-full" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-center">{t('searchResults.error', '加载搜索结果失败。')}</p>
      )}

      {!isLoading && !error && results && results.length === 0 && (
        <p className="text-gray-500 text-center py-8">{t('searchResults.noResults', '未找到与 "{{searchTerm}}"相关的书籍。', { searchTerm: searchTerm || '' })}</p>
      )}

      {!isLoading && !error && results && results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {results.map((book) => (
            <BookCard key={book.id} book={book} className="bg-white shadow-md hover:shadow-lg transition-shadow" />
          ))}
        </div>
      )}
    </div>
  );
} 