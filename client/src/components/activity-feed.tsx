import { useTranslation } from "react-i18next";
import type { Activity, User, Book } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/utils";

interface ActivityFeedProps {
  activities?: Activity[];
  isLoading?: boolean;
}

export default function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  const { t } = useTranslation();

  // Fetch users and books for reference
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: books } = useQuery<Book[]>({
    queryKey: ['/api/books'],
  });

  const getUserById = (userId: number): User | undefined => {
    return users?.find(user => user.id === userId);
  };

  const getBookById = (bookId: number): Book | undefined => {
    return books?.find(book => book.id === bookId);
  };

  const getActivityIcon = (activityType: string): { icon: string; bgColor: string } => {
    switch (activityType) {
      case 'read':
        return { icon: 'fas fa-book-reader', bgColor: 'bg-blue-100' };
      case 'borrow':
        return { icon: 'fas fa-exchange-alt', bgColor: 'bg-green-100' };
      case 'add':
        return { icon: 'fas fa-plus', bgColor: 'bg-purple-100' };
      case 'rate':
        return { icon: 'fas fa-star', bgColor: 'bg-yellow-100' };
      case 'return':
        return { icon: 'fas fa-undo-alt', bgColor: 'bg-red-100' };
      default:
        return { icon: 'fas fa-info-circle', bgColor: 'bg-gray-100' };
    }
  };

  const getActivityText = (activity: Activity): string => {
    const user = getUserById(activity.userId);
    const book = activity.bookId ? getBookById(activity.bookId) : undefined;
    const relatedUser = activity.relatedUserId ? getUserById(activity.relatedUserId) : undefined;
    
    const userName = user?.displayName || t('activityFeed.unknownUser');
    const bookTitle = book?.title || t('activityFeed.unknownBook');
    const relatedUserName = relatedUser?.displayName || t('activityFeed.unknownUser');

    switch (activity.activityType) {
      case 'read':
        if (activity.data?.action === 'started_reading') {
          return t('activityFeed.startedReading', { user: userName, book: bookTitle });
        } else if (activity.data?.action === 'finished_reading') {
          return t('activityFeed.finishedReading', { user: userName, book: bookTitle });
        }
        break;
      case 'borrow':
        if (activity.data?.action === 'borrowed_book') {
          return t('activityFeed.borrowedBook', { 
            user: userName, 
            book: bookTitle,
            from: relatedUserName
          });
        }
        break;
      case 'add':
        if (activity.data?.action === 'added_book') {
          return t('activityFeed.addedBook', { user: userName, book: bookTitle });
        }
        break;
      case 'rate':
        if (activity.data?.action === 'rated_book') {
          const rating = activity.data?.rating || 0;
          return t('activityFeed.ratedBook', { 
            user: userName, 
            book: bookTitle,
            rating
          });
        }
        break;
      case 'return':
        if (activity.data?.action === 'returned_book') {
          return t('activityFeed.returnedBook', { 
            user: userName, 
            book: bookTitle,
            to: relatedUserName
          });
        }
        break;
    }
    
    return t('activityFeed.genericActivity', { user: userName });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={`activity-skeleton-${i}`} className="flex items-start">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="ml-3">
                <Skeleton className="h-4 w-60 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))
        ) : activities && activities.length > 0 ? (
          activities.map(activity => {
            const { icon, bgColor } = getActivityIcon(activity.activityType);
            return (
              <div key={activity.id} className="flex items-start">
                <div className={`${bgColor} p-2 rounded-full`}>
                  <i className={`${icon} ${activity.activityType === 'read' ? 'text-blue-600' : 
                                          activity.activityType === 'borrow' ? 'text-green-600' : 
                                          activity.activityType === 'add' ? 'text-purple-600' : 
                                          activity.activityType === 'rate' ? 'text-yellow-600' : 
                                          activity.activityType === 'return' ? 'text-red-600' : 'text-gray-600'}`}></i>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{getActivityText(activity)}</p>
                  <p className="text-xs text-gray-500">{formatRelativeTime(new Date(activity.timestamp))}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">{t('activityFeed.noActivities')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
