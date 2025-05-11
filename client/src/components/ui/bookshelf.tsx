// import { useState } from "react"; // 移除未使用的 useState
import type { Book } from "@/lib/types";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { type ShelfPosition } from "@/lib/types";
import { Link } from "react-router-dom";
import { getBookCoverPlaceholder } from "@/lib/utils";

interface BookshelfProps {
  numShelves: number;
  shelfNames?: Record<string, string>; // Map<number, string> equivalent (1-based index as string key)
  books: Book[];
  onAddBook?: (shelfPosition: ShelfPosition) => void;
  onAddShelf?: () => void;
  bookshelfId?: number; // Added for creating unique keys if needed, or other operations
}

export function Bookshelf({ numShelves, shelfNames, books, onAddBook, onAddShelf, bookshelfId }: BookshelfProps) {
  const { t } = useTranslation();

  // Organize books by shelf
  const booksByShelf = Array.from({ length: numShelves }, (_, shelfIndex) => {
    return books.filter(book => {
      if (!book || !book.shelfPosition) { // Explicitly check for null/undefined shelfPosition
        return false;
      }
      return book.shelfPosition.shelf - 1 === shelfIndex; // 减1将1-based转换为0-based索引
    });
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col space-y-6">
        {booksByShelf.map((shelfBooks, shelfIndex) => {
          const currentShelfNumber = shelfIndex + 1; // 1-based for display and map key
          const shelfDisplayName = shelfNames?.[currentShelfNumber.toString()] || t('bookshelf.defaultShelfName', { number: currentShelfNumber });
          
          return (
            <div key={`shelf-${bookshelfId}-${shelfIndex}`} className="flex flex-col">
              <h4 className="text-md font-semibold text-gray-700 mb-2 px-2">{shelfDisplayName}</h4>
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-2 px-2 py-3 bookshelf-shelf rounded">
                {shelfBooks.map((book) => {
                  // Ensure book is valid and has an id before rendering
                  if (!book || typeof book.id === 'undefined') return null;
                  return (
                    <div key={book.id} className="book-card flex flex-col items-center text-center">
                      <Link to={`/books/${book.id}`} className="block w-full">
                        <img 
                          src={book.coverImage || book.coverImageUrl || getBookCoverPlaceholder()} 
                          className="h-24 w-full object-cover rounded shadow-sm mb-1"
                          alt={book.title} 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = getBookCoverPlaceholder();
                          }}
                        />
                        <p className="text-xs font-semibold text-gray-700 truncate w-full px-1" title={book.title}>
                          {book.title}
                        </p>
                      </Link>
                    </div>
                  );
                })}

                {/* Add book placeholder */}
                {/* Ensure onAddBook and shelfPosition are valid before calling in onClick */}
                {shelfBooks.length < 6 && onAddBook && (
                  <div 
                    className="book-card bg-gray-100 flex items-center justify-center cursor-pointer h-24"
                    onClick={() => onAddBook({ shelf: currentShelfNumber, position: shelfBooks.length + 1 })}
                  >
                    <i className="fas fa-plus text-gray-400"></i>
                  </div>
                )}

                {/* Additional placeholders to fill up to 6 slots */}
                {Array.from({ length: Math.max(0, (onAddBook ? 5 : 6) - shelfBooks.length) }).map((_, i) => (
                  <div key={`placeholder-${shelfIndex}-${i}`} className="book-card bg-gray-100 flex items-center justify-center h-24">
                    {/* Empty placeholder slot */}
                  </div>
                ))}
              </div>
              <div className="h-1 bg-secondary/30 rounded-b"></div>
            </div>
          );
        })}
        
        {onAddShelf && (
          <Button 
            variant="outline" 
            className="text-primary border-dashed border-primary/40 hover:bg-primary/5 mt-4"
            onClick={onAddShelf}
          >
            <i className="fas fa-plus mr-2"></i> {t('bookshelf.addShelfButton', '添加新层')}
          </Button>
        )}
      </div>
    </div>
  );
}
