import { useTranslation } from "react-i18next";
import type { Book } from "@/lib/types";
import { formatDate, getBookCoverPlaceholder } from "@/lib/utils";
import { Link } from "react-router-dom";

interface BookCardProps extends React.HTMLAttributes<HTMLDivElement> {
  book: Book;
  showLocation?: boolean;
}

export function BookCard({ book, className, showLocation = false }: BookCardProps) {
  const { t } = useTranslation();

  let locationString = book.bookshelfName || t('bookCard.unknownBookshelf', '未知书架');
  if (book.familyName) {
    locationString = `${t('bookCard.family', '家庭')}: ${book.familyName} > ${t('bookCard.bookshelf', '书架')}: ${book.bookshelfName}`;
  }
  if (book.shelfPosition) {
    locationString += ` (${t('bookCard.shelf', '层')} ${book.shelfPosition.shelf}, ${t('bookCard.position', '位置')} ${book.shelfPosition.position})`;
  }

  return (
    <div className={`flex book-card p-3 rounded-lg border border-gray-100 ${className || ''}`}>
      <Link to={`/books/${book.id}`} className="flex-shrink-0">
        <div className="cursor-pointer">
          <img 
            src={book.coverImage || book.coverImageUrl || getBookCoverPlaceholder()} 
            className="w-20 h-28 object-cover rounded shadow-sm" 
            alt={book.title} 
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = getBookCoverPlaceholder();
            }}
          />
        </div>
      </Link>
      <div className="ml-3 flex flex-col justify-between flex-1 min-w-0">
        <div>
          <h3 className="font-heading font-bold truncate" title={book.title}>{book.title}</h3>
          <p className="text-sm text-gray-600 truncate" title={book.author}>{book.author}</p>
          {showLocation && (
            <p className="text-xs text-gray-500 mt-1 truncate" title={locationString}>Location: {locationString}</p>
          )}
          <div className="flex items-center mt-1 flex-wrap">
            {book.category && (
              <span className="bg-accent/50 text-primary/80 text-xs px-2 py-0.5 rounded mr-1 mb-1">
                {book.category}
              </span>
            )}
            {book.isbn && (
              <span className="text-xs text-gray-500 system-text mr-1 mb-1">
                ISBN: {book.isbn}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500">
            {book.addedDate ? formatDate(new Date(book.addedDate)) : ''}
          </span>
          <StatusBadge status={book.status} />
        </div>
      </div>
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation();
  
  switch(status) {
    case 'available':
      return (
        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
          {t('bookStatus.available')}
        </span>
      );
    case 'borrowed':
      return (
        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
          {t('bookStatus.borrowed')}
        </span>
      );
    case 'reading':
      return (
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
          {t('bookStatus.reading')}
        </span>
      );
    default:
      return (
        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
          {status}
        </span>
      );
  }
}
