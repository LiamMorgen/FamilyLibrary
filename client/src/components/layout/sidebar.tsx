// import { useEffect } from "react"; // 移除
// import { useLocation, Link } from "wouter"; // 移除 wouter 导入
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import type { User, Family } from "@/lib/types";
// import { cn } from "@/lib/utils"; // 移除
import { Link, useLocation } from "react-router-dom"; // 移除了 useNavigate
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // 移除
// import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; // 移除
// import { ScrollArea } from "@/components/ui/scroll-area"; // 移除
import { useState } from "react"; // 添加useState
import { CreateFamilyDialog } from "@/components/dialogs/CreateFamilyDialog"; // 导入CreateFamilyDialog
import { fetchMyActiveLendingsCount } from "@/lib/queryClient"; // Import the new API function

export default function Sidebar() {
  const location = useLocation(); 
  const isMobile = useMobile();
  const { t } = useTranslation();
  const token = localStorage.getItem('token'); // Get token
  const [isCreateFamilyDialogOpen, setIsCreateFamilyDialogOpen] = useState(false); // 添加状态控制创建家庭对话框

  // @ts-ignore
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/users/current'],
    enabled: !!token,
  });

  // Fetch family only if token exists
  const { data: family, isLoading: isLoadingFamily } = useQuery<Family>({
    queryKey: ['/api/families/current'],
    enabled: !!token && !!currentUser, // Also depend on currentUser for consistency
  });

  // Fetch family members only if token exists and family data is loaded
  const { data: familyMembers, isLoading: isLoadingFamilyMembers } = useQuery<User[]>({
    queryKey: ['/api/families/current/users'],
    enabled: !!token && !!family, // Depend on token and family data
  });

  // Fetch count of current user's active lendings for the badge
  // @ts-ignore
  const { data: myActiveLendingsCount, isLoading: isLoadingMyActiveLendingsCount } = useQuery<number>({
    queryKey: ['/api/book-lendings/my-active/count'], // Consistent queryKey with dashboard
    queryFn: fetchMyActiveLendingsCount,
    enabled: !!currentUser, // Only fetch if currentUser is loaded
    // staleTime: 5 * 60 * 1000, // Optional: Cache for 5 minutes
    // refetchInterval: 5 * 60 * 1000, // Optional: Refetch every 5 minutes
  });

  // Hide sidebar on mobile
  if (isMobile) {
    return null;
  }

  return (
    <aside className="hidden md:block bg-white w-64 shadow-lg">
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading font-bold text-lg">
              {isLoadingFamily ? t('sidebar.loadingFamily') : (family?.name || t('sidebar.family'))}
            </h2>
            <p className="text-sm text-gray-500">
              {family ? (
                t('sidebar.familyMembersCount', { count: familyMembers?.length || 0, defaultValue: `${familyMembers?.length || 0}位成员` })
              ) : (
                t('sidebar.noFamily', { defaultValue: '您尚未加入家庭' })
              )}
            </p>
          </div>
          <div className="bg-primary/10 text-primary p-2 rounded-full">
            <i className="fas fa-home"></i>
          </div>
        </div>
        
        <nav>
          <ul>
            <li className="mb-1">
              <Link to="/"> {/* 确保 Link 是 react-router-dom 的 Link, 使用 to prop */}
                <div className={`flex items-center px-4 py-2 rounded-lg ${
                  location.pathname === '/' 
                    ? 'text-primary bg-accent/30' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}>
                  <i className="fas fa-th-large w-5"></i>
                  <span className="ml-2">{t('sidebar.dashboard')}</span>
                </div>
              </Link>
            </li>
            <li className="mb-1">
              <Link to="/my-bookshelf"> {/* 使用 to prop */}
                <div className={`flex items-center px-4 py-2 rounded-lg ${
                  location.pathname === '/my-bookshelf' 
                    ? 'text-primary bg-accent/30' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}>
                  <i className="fas fa-bookmark w-5"></i>
                  <span className="ml-2">{t('sidebar.myBookshelf')}</span>
                </div>
              </Link>
            </li>
            <li className="mb-1">
              <Link to="/family-bookshelf"> {/* 使用 to prop */}
                <div className={`flex items-center px-4 py-2 rounded-lg ${
                  location.pathname === '/family-bookshelf' 
                    ? 'text-primary bg-accent/30' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}>
                  <i className="fas fa-users w-5"></i>
                  <span className="ml-2">{t('sidebar.familyBookshelf')}</span>
                </div>
              </Link>
            </li>
            <li className="mb-1">
              <Link to="/borrowing-records">
                <div className={`flex items-center px-4 py-2 rounded-lg ${
                  location.pathname === '/borrowing-records' 
                    ? 'text-primary bg-accent/30' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}>
                  <i className="fas fa-exchange-alt w-5"></i>
                  <span className="ml-2">{t('sidebar.borrowingRecords')}</span>
                  {myActiveLendingsCount !== undefined && myActiveLendingsCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {myActiveLendingsCount}
                    </span>
                  )}
                </div>
              </Link>
            </li>
            <li className="mb-1">
              <Link to="/reading-stats"> {/* 使用 to prop */}
                <div className={`flex items-center px-4 py-2 rounded-lg ${
                  location.pathname === '/reading-stats' 
                    ? 'text-primary bg-accent/30' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}>
                  <i className="fas fa-chart-bar w-5"></i>
                  <span className="ml-2">{t('sidebar.readingStats')}</span>
                </div>
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-heading font-bold mb-2">{t('sidebar.familyMembers')}</h3>
          {isLoadingFamilyMembers || isLoadingFamily ? (
            <p className="text-sm text-gray-500">{t('sidebar.loadingMembers')}</p>
          ) : familyMembers && familyMembers.length > 0 ? (
            <ul className="space-y-2">
              {familyMembers.map(member => (
                <li key={member.id} className="flex items-center">
                  <img 
                    src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.displayName)}`} 
                    alt={member.displayName} 
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="ml-2">{member.displayName}</span>
                  <span 
                    className={`ml-auto text-xs ${member.isOnline ? 'bg-green-500' : 'bg-gray-300'} w-2 h-2 rounded-full`} 
                    title={member.isOnline ? t('sidebar.online') : t('sidebar.offline')}
                  ></span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">{t('sidebar.noMembersFound')}</p> // Or a more appropriate message
          )}
        </div>
      </div>
      
      <div className="px-4 py-2 mt-4">
        {!family ? (
          <div className="bg-accent/30 p-4 rounded-lg">
            <h3 className="font-heading font-bold text-sm mb-2">{t('sidebar.createFamily', { defaultValue: '创建家庭' })}</h3>
            <p className="text-xs text-gray-600 mb-3">{t('sidebar.createFamilyDescription', { defaultValue: '创建一个家庭，邀请家人一起管理图书！' })}</p>
            <Button 
              className="w-full flex items-center justify-center"
              variant="default"
              onClick={() => setIsCreateFamilyDialogOpen(true)}
            >
              <i className="fas fa-users mr-1"></i> {t('sidebar.createFamilyButton', { defaultValue: '创建家庭' })}
            </Button>
          </div>
        ) : (
          <div className="bg-accent/30 p-4 rounded-lg">
            <h3 className="font-heading font-bold text-sm mb-2">{t('sidebar.addNewMember')}</h3>
            <p className="text-xs text-gray-600 mb-3">{t('sidebar.inviteFamily')}</p>
            <Button 
              className="w-full flex items-center justify-center"
              variant="default"
            >
              <i className="fas fa-user-plus mr-1"></i> {t('sidebar.inviteMember')}
            </Button>
          </div>
        )}
      </div>

      {/* 创建家庭对话框 */}
      <CreateFamilyDialog
        isOpen={isCreateFamilyDialogOpen}
        onOpenChange={setIsCreateFamilyDialogOpen}
        onSuccess={() => {
          // 成功创建家庭后刷新家庭数据
          // 这里假设 useQuery 的 queryClient 能够处理 invalidateQueries
          // 更好的做法是引入 queryClient 并调用 invalidateQueries
          // queryClient.invalidateQueries({ queryKey: ['/api/families/current'] });
          window.location.reload(); // 简单的解决方案：刷新页面
        }}
      />
    </aside>
  );
}
