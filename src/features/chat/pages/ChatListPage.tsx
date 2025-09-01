import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { ChatList } from '@/components/chat/ChatList';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { 
  MessageCircle, 
  Search, 
  Settings, 
  Moon, 
  Sun, 
  Users, 
  UserPlus,
  Menu,
  X
} from 'lucide-react';
import { clsx } from 'clsx';

export const ChatListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  
  const { user, signOut } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();

  const handleNewChat = () => {
    // Keşif sayfasına yönlendir
    navigate('/discover');
  };

  const handleNewGroup = () => {
    // TODO: Yeni grup modal'ı aç
    console.log('Yeni grup');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Çıkış hatası:', error);
    }
  };

  return (
    <div className="h-screen bg-white dark:bg-gray-900 flex">
      {/* Sidebar - Mobile */}
      <div className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:hidden',
        showSidebar ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Menü
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSidebar(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="p-4 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleNewChat}
          >
            <UserPlus className="w-5 h-5 mr-3" />
            Sohbet Başlat
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleNewGroup}
          >
            <Users className="w-5 h-5 mr-3" />
            Yeni Grup
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={toggleTheme}
          >
            {theme.mode === 'dark' ? (
              <Sun className="w-5 h-5 mr-3" />
            ) : (
              <Moon className="w-5 h-5 mr-3" />
            )}
            {theme.mode === 'dark' ? 'Açık Tema' : 'Koyu Tema'}
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => navigate('/settings')}
          >
            <Settings className="w-5 h-5 mr-3" />
            Ayarlar
          </Button>
        </div>
      </div>

      {/* Overlay - Mobile */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(true)}
                className="lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* Logo */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  WTApp
                </h1>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-2">
              {/* Desktop actions */}
              <div className="hidden lg:flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewChat}
                  title="Sohbet Başlat"
                >
                  <UserPlus className="w-5 h-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewGroup}
                  title="Yeni Grup"
                >
                  <Users className="w-5 h-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  title={theme.mode === 'dark' ? 'Açık Tema' : 'Koyu Tema'}
                >
                  {theme.mode === 'dark' ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/settings')}
                  title="Ayarlar"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </div>

              {/* Profile */}
              <div className="relative group">
                <Avatar
                  src={user?.photoURL}
                  name={user?.displayName || 'Kullanıcı'}
                  size="sm"
                  isOnline={true}
                  onClick={() => navigate('/settings')}
                  className="cursor-pointer"
                />
                
                {/* Profile dropdown - TODO: Implement */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user?.displayName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user?.about}
                    </p>
                  </div>
                  <div className="p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-red-600 hover:text-red-700"
                      onClick={handleSignOut}
                    >
                      Çıkış Yap
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <Input
            type="text"
            placeholder="Sohbetlerde ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search />}
          />
        </div>

        {/* Chat List */}
        <ChatList />
      </div>
    </div>
  );
};
