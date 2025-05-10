import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
// import { Link, useNavigate } from "react-router-dom"; // 移除未使用的导入
import type { User } from "@/lib/types";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import { Button } from "@/components/ui/button"; // 移除未使用的导入

export default function Header() {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const token = localStorage.getItem('token'); // Get token

  // Fetch current user only if token exists
  const { data: currentUser, isLoading: isLoadingCurrentUser } = useQuery<User>({
    queryKey: ['/api/users/current'],
    enabled: !!token, // <--- Only enable if token exists
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search
    console.log("Searching for:", searchQuery);
  };

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
  };

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <i className="fas fa-book-open text-2xl mr-2"></i>
          <h1 className="text-xl font-heading font-bold">{t('header.familyLibrary')}</h1>
        </div>
        
        {/* Search bar - desktop */}
        <form 
          onSubmit={handleSearchSubmit}
          className="hidden md:flex items-center bg-white/20 rounded-lg px-3 py-1 flex-grow mx-8 max-w-xl"
        >
          <i className="fas fa-search text-white/70 mr-2"></i>
          <input 
            type="text" 
            placeholder={t('header.searchPlaceholder')}
            className="bg-transparent border-none w-full focus:outline-none text-white placeholder-white/70"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
        
        {/* User profile */}
        <div className="flex items-center">
          <div className="hidden md:flex items-center mr-4">
            <i className="fas fa-bell text-white/80 text-lg"></i>
            <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center -ml-1 -mt-2">2</span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center focus:outline-none">
              <img 
                src={currentUser?.avatar || "https://ui-avatars.com/api/?name=User"} 
                alt={t('header.userAvatar')} 
                className="w-8 h-8 rounded-full mr-2"
              />
              <span className="hidden md:inline-block">
                {isLoadingCurrentUser ? t('header.loadingUser') : (currentUser?.displayName || t('header.user'))}
              </span>
              <i className="fas fa-chevron-down ml-1 text-xs"></i>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{t('header.account')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <i className="fas fa-user mr-2"></i> {t('header.profile')}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <i className="fas fa-cog mr-2"></i> {t('header.settings')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => changeLanguage('zh')}>
                <span className={i18n.language === 'zh' ? 'font-bold' : ''}>中文</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('en')}>
                <span className={i18n.language === 'en' ? 'font-bold' : ''}>English</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <i className="fas fa-sign-out-alt mr-2"></i> {t('header.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Mobile search bar */}
      <form 
        onSubmit={handleSearchSubmit}
        className="md:hidden px-4 pb-3"
      >
        <div className="flex items-center bg-white/20 rounded-lg px-3 py-2">
          <i className="fas fa-search text-white/70 mr-2"></i>
          <input 
            type="text" 
            placeholder={t('header.searchPlaceholder')}
            className="bg-transparent border-none w-full focus:outline-none text-white placeholder-white/70"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </form>
    </header>
  );
}
