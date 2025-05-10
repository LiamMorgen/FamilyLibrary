// import { useState } from "react"; // 移除未使用的 useState
import type { Book } from "@/lib/types";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { type ShelfPosition } from "@/lib/types";
import { Link } from "wouter";

interface BookshelfProps {
  numShelves: number;
  books: Book[];
  onAddBook?: (shelfPosition: ShelfPosition) => void;
  onAddShelf?: () => void;
}

export function Bookshelf({ numShelves, books, onAddBook, onAddShelf }: BookshelfProps) {
  const { t } = useTranslation();

  // Organize books by shelf
  const booksByShelf = Array.from({ length: numShelves }, (_, shelfIndex) => {
    return books.filter(book => book.shelfPosition.shelf === shelfIndex);
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col space-y-6">
        {booksByShelf.map((shelfBooks, shelfIndex) => (
          <div key={`shelf-${shelfIndex}`} className="flex flex-col">
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-2 px-2 py-3 bookshelf-shelf rounded">
              {shelfBooks.map((book) => (
                <div key={book.id} className="book-card">
                  <Link href={`/books/${book.id}`}>
                    <a className="block">
                      <img 
                        src={book.coverImage || 'https://via.placeholder.com/150x230?text=No+Cover'} 
                        className="h-24 w-full object-cover rounded shadow-sm" 
                        alt={book.title} 
                      />
                    </a>
                  </Link>
                </div>
              ))}

              {/* Add book placeholder - each shelf can have at most 6 books */}
              {shelfBooks.length < 6 && (
                <div 
                  className="book-card bg-gray-100 flex items-center justify-center cursor-pointer h-24"
                  onClick={() => onAddBook?.({ shelf: shelfIndex, position: shelfBooks.length })}
                >
                  <i className="fas fa-plus text-gray-400"></i>
                </div>
              )}

              {/* Additional placeholders to fill up to 6 slots */}
              {Array.from({ length: Math.max(0, 5 - shelfBooks.length) }).map((_, i) => (
                <div key={`placeholder-${i}`} className="book-card bg-gray-100 flex items-center justify-center h-24">
                  <i className="fas fa-plus text-gray-400"></i>
                </div>
              ))}
            </div>
            <div className="h-1 bg-secondary/30 rounded-b"></div>
          </div>
        ))}
        
        {onAddShelf && (
          <Button 
            variant="outline" 
            className="text-primary border-dashed border-primary/40 hover:bg-primary/5"
            onClick={onAddShelf}
          >
            <i className="fas fa-plus mr-2"></i> {t('addBookshelf')}
          </Button>
        )}
      </div>
    </div>
  );
}
