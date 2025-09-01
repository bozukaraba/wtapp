import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { MessageCircle, Search, Copy, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const UsernameChat: React.FC = () => {
  const [searchUsername, setSearchUsername] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  
  const { user, findUserByUsername, createDirectChatByUsername } = useAuthStore();

  const handleSearch = async () => {
    if (!searchUsername.trim()) {
      toast.error('Lütfen bir kullanıcı adı girin');
      return;
    }

    try {
      setIsSearching(true);
      setFoundUser(null);
      
      const user = await findUserByUsername(searchUsername.trim());
      
      if (user) {
        setFoundUser(user);
        toast.success('Kullanıcı bulundu!');
      } else {
        toast.error('Kullanıcı bulunamadı');
      }
    } catch (error) {
      console.error('Kullanıcı arama hatası:', error);
      toast.error('Arama sırasında bir hata oluştu');
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartChat = async () => {
    if (!foundUser) return;

    try {
      setIsStartingChat(true);
      const chatId = await createDirectChatByUsername(foundUser.username);
      
      toast.success(`${foundUser.displayName} ile sohbet başlatıldı!`);
      
      // Chat sayfasına yönlendir
      window.location.href = `/chats/${chatId}`;
    } catch (error: any) {
      console.error('Sohbet başlatma hatası:', error);
      toast.error(error.message || 'Sohbet başlatılamadı');
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleCopyUsername = () => {
    if (user?.username) {
      navigator.clipboard.writeText(user.username);
      toast.success('Kullanıcı adınız kopyalandı!');
    }
  };

  const handleShareUsername = async () => {
    if (!user?.username) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'WTApp Kullanıcı Adım',
          text: `WTApp'te benimle sohbet etmek için kullanıcı adımı kullan: ${user.username}`,
          url: window.location.origin
        });
      } catch (error) {
        console.log('Paylaşım iptal edildi');
      }
    } else {
      // Fallback: clipboard'a kopyala
      handleCopyUsername();
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Kendi Username'i Göster */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Sizin Kullanıcı Adınız
        </h2>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar
              src={user?.photoURL}
              name={user?.displayName || 'Kullanıcı'}
              size="md"
            />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {user?.displayName}
              </p>
              <p className="text-sm text-primary-600 dark:text-primary-400 font-mono">
                {user?.username}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyUsername}
              title="Kopyala"
            >
              <Copy className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShareUsername}
              title="Paylaş"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 Bu kullanıcı adını paylaşarak diğer kişilerin sizinle sohbet başlatmasını sağlayabilirsiniz
          </p>
        </div>
      </div>

      {/* Username ile Arama */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Kullanıcı Adı ile Sohbet Başlat
        </h2>
        
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="NeşeliMaviAslan123#A1B2C3"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              leftIcon={<Search />}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              isLoading={isSearching}
              disabled={!searchUsername.trim()}
            >
              Ara
            </Button>
          </div>

          {/* Bulunan Kullanıcı */}
          {foundUser && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={foundUser.photoURL}
                    name={foundUser.displayName}
                    size="md"
                    isOnline={foundUser.isOnline}
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {foundUser.displayName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {foundUser.about}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      {foundUser.username}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleStartChat}
                  isLoading={isStartingChat}
                  leftIcon={<MessageCircle className="w-4 h-4" />}
                >
                  Sohbet Başlat
                </Button>
              </div>
            </div>
          )}

          {/* Kullanım Talimatları */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              💡 Nasıl Kullanılır?
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Arkadaşınızdan kullanıcı adını isteyin</li>
              <li>• Kullanıcı adını tam olarak yazın (# işareti dahil)</li>
              <li>• "Ara" butonuna tıklayın</li>
              <li>• Kullanıcı bulunursa "Sohbet Başlat" butonuna tıklayın</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
