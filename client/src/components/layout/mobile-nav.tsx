import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMobile } from "@/hooks/use-mobile";

export default function MobileNav() {
  const location = useLocation();
  const isMobile = useMobile();
  const { t } = useTranslation();

  // Only show on mobile
  if (!isMobile) {
    return null;
  }

  return (
    <nav className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
      <div className="flex justify-around">
        <Link 
          to="/"
          className={`flex flex-col items-center py-2 px-3 ${location.pathname === '/' ? 'text-primary' : 'text-gray-500'}`}
        >
          <i className="fas fa-th-large text-lg"></i>
          <span className="text-xs mt-1">{t('mobileNav.home')}</span>
        </Link>
        <Link 
          to="/my-bookshelf"
          className={`flex flex-col items-center py-2 px-3 ${location.pathname === '/my-bookshelf' ? 'text-primary' : 'text-gray-500'}`}
        >
          <i className="fas fa-bookmark text-lg"></i>
          <span className="text-xs mt-1">{t('mobileNav.bookshelf')}</span>
        </Link>
        <Link 
          to="/add-book"
          className="flex flex-col items-center py-2 px-3 text-gray-500"
        >
          <div className="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center -mt-5">
            <i className="fas fa-plus"></i>
          </div>
          <span className="text-xs mt-1">{t('mobileNav.add')}</span>
        </Link>
        <Link 
          to="/borrowing-records"
          className={`flex flex-col items-center py-2 px-3 ${location.pathname === '/borrowing-records' ? 'text-primary' : 'text-gray-500'} relative`}
        >
          <i className="fas fa-exchange-alt text-lg"></i>
          <span className="text-xs mt-1">{t('mobileNav.borrowing')}</span>
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">2</span>
        </Link>
        <Link 
          to="/profile"
          className={`flex flex-col items-center py-2 px-3 ${location.pathname === '/profile' ? 'text-primary' : 'text-gray-500'}`}
        >
          <i className="fas fa-user text-lg"></i>
          <span className="text-xs mt-1">{t('mobileNav.profile')}</span>
        </Link>
      </div>
    </nav>
  );
}
