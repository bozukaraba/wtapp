import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { UsernameChat } from '@/components/chat/UsernameChat';
import { useDiscoveryStore } from '@/store/discoveryStore';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { 
  Users, 
  MapPin, 
  Shuffle, 
  MessageCircle, 
  Navigation,
  RefreshCw,
  Settings,
  Hash
} from 'lucide-react';
import { User } from '@/types';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

export const UserDiscovery: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'username' | 'random' | 'nearby'>('username');
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  
  const { 
    nearbyUsers, 
    randomUsers, 
    isDiscovering, 
    userLocation,
    discoveryPreferences,
    startDiscovery, 
    stopDiscovery, 
    findRandomUsers, 
    findNearbyUsers,
    requestLocation,
    updateDiscoveryPreferences,
    sendConnectionRequest
  } = useDiscoveryStore();
  
  const { createDirectChat } = useChatStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && !isDiscovering) {
      handleStartDiscovery();
    }

    return () => {
      if (user && isDiscovering) {
        stopDiscovery(user.uid);
      }
    };
  }, [user]);

  const handleStartDiscovery = async () => {
    if (!user) return;

    try {
      await startDiscovery(user.uid);
      await findRandomUsers(user.uid);
      
      if (userLocation) {
        await findNearbyUsers(user.uid);
      }
    } catch (error) {
      console.error('Discovery başlatma hatası:', error);
      toast.error('Kullanıcı keşfi başlatılamadı');
    }
  };

  const handleLocationRequest = async () => {
    try {
      await requestLocation();
      setIsLocationEnabled(true);
      
      if (user) {
        await findNearbyUsers(user.uid);
      }
      
      toast.success('Konum izni verildi');
    } catch (error) {
      console.error('Konum izni hatası:', error);
      toast.error('Konum izni alınamadı');
    }
  };

  const handleRefresh = async () => {
    if (!user) return;

    try {
      if (activeTab === 'random') {
        await findRandomUsers(user.uid);
      } else {
        await findNearbyUsers(user.uid);
      }
      toast.success('Liste yenilendi');
    } catch (error) {
      toast.error('Liste yenilenemedi');
    }
  };

  const handleStartChat = async (otherUser: User) => {
    if (!user) return;

    try {
      const chatId = await createDirectChat(otherUser.uid, user.uid);
      toast.success(`${otherUser.displayName} ile sohbet başlatıldı!`);
      
      // Chat sayfasına yönlendir
      window.location.href = `/chats/${chatId}`;
    } catch (error) {
      console.error('Sohbet başlatma hatası:', error);
      toast.error('Sohbet başlatılamadı');
    }
  };

  const renderUserCard = (discoveredUser: User & { distance?: number }) => (
    <div 
      key={discoveredUser.uid}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar
            src={discoveredUser.photoURL}
            name={discoveredUser.displayName}
            size="md"
            isOnline={discoveredUser.isOnline}
          />
          
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {discoveredUser.displayName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {discoveredUser.about}
            </p>
            {discoveredUser.distance && (
              <p className="text-xs text-gray-400 flex items-center mt-1">
                <MapPin className="w-3 h-3 mr-1" />
                ~{discoveredUser.distance} km uzakta
              </p>
            )}
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => handleStartChat(discoveredUser)}
          leftIcon={<MessageCircle className="w-4 h-4" />}
        >
          Sohbet Başlat
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Yeni İnsanlarla Tanış
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Rastgele kullanıcılarla sohbet başlat veya yakınındakileri keşfet
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab('username')}
          className={clsx(
            'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors',
            activeTab === 'username'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          <Hash className="w-4 h-4 inline mr-1" />
          Kullanıcı Adı
        </button>
        
        <button
          onClick={() => setActiveTab('random')}
          className={clsx(
            'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors',
            activeTab === 'random'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          <Shuffle className="w-4 h-4 inline mr-1" />
          Rastgele
        </button>
        
        <button
          onClick={() => setActiveTab('nearby')}
          className={clsx(
            'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors',
            activeTab === 'nearby'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          <MapPin className="w-4 h-4 inline mr-1" />
          Yakındaki
        </button>
      </div>

      {/* Location Permission */}
      {activeTab === 'nearby' && !userLocation && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Konum İzni Gerekli
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Yakınındaki kullanıcıları bulmak için konum izni verin
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleLocationRequest}
              size="sm"
              leftIcon={<MapPin className="w-4 h-4" />}
            >
              İzin Ver
            </Button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          {userLocation && (
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {userLocation.city}, {userLocation.country}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Yenile
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Settings className="w-4 h-4" />}
          >
            Ayarlar
          </Button>
        </div>
      </div>

      {/* User List */}
      <div className="space-y-3">
        {activeTab === 'username' && (
          <UsernameChat />
        )}

        {activeTab === 'random' && (
          <>
            {randomUsers.length > 0 ? (
              randomUsers.map(renderUserCard)
            ) : (
              <div className="text-center py-12">
                <Shuffle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Henüz aktif kullanıcı yok
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Şu anda başka misafir kullanıcı bulunamadı
                </p>
                <Button onClick={handleRefresh} size="sm">
                  Tekrar Dene
                </Button>
              </div>
            )}
          </>
        )}

        {activeTab === 'nearby' && (
          <>
            {userLocation ? (
              nearbyUsers.length > 0 ? (
                nearbyUsers.map(renderUserCard)
              ) : (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Yakınında kimse yok
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {discoveryPreferences.maxDistance} km çevrenizde aktif kullanıcı bulunamadı
                  </p>
                  <Button onClick={handleRefresh} size="sm">
                    Tekrar Ara
                  </Button>
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <Navigation className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Konum İzni Gerekli
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Yakınındaki kullanıcıları görmek için konum izni verin
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Discovery Status */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={clsx(
              'w-3 h-3 rounded-full',
              isDiscovering ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            )} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isDiscovering ? 'Keşif aktif' : 'Keşif pasif'}
            </span>
          </div>
          
          <span className="text-xs text-gray-500">
            {activeTab === 'random' ? randomUsers.length : nearbyUsers.length} kullanıcı bulundu
          </span>
        </div>
      </div>
    </div>
  );
};
