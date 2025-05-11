import { useTranslation } from "react-i18next";
import type { Book } from "@/lib/types";
import { formatDate, getBookCoverPlaceholder } from "@/lib/utils";
import { Link } from "react-router-dom";

interface BookCardProps extends React.HTMLAttributes<HTMLDivElement> {
  book: Book;
}

export function BookCard({ book, className /*, ...props*/ }: BookCardProps) {
  // const navigate = useNavigate(); // Removed unused navigate

  return (
    <div className={`flex book-card p-3 rounded-lg border border-gray-100 ${className || ''}`}>
      <Link to={`/books/${book.id}`}>
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
      <div className="ml-3 flex flex-col justify-between flex-1">
        <div>
          <h3 className="font-heading font-bold">{book.title}</h3>
          <p className="text-sm text-gray-600">{book.author}</p>
          <div className="flex items-center mt-1">
            {book.category && (
              <span className="bg-accent/50 text-primary/80 text-xs px-2 py-0.5 rounded">
                {book.category}
              </span>
            )}
            {book.isbn && (
              <span className="text-xs text-gray-500 ml-2 system-text">
                ISBN: {book.isbn}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {formatDate(new Date(book.addedDate))}
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
