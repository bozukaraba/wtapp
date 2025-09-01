import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { 
  ArrowLeft, 
  Camera, 
  Bell, 
  Shield, 
  Moon, 
  Sun, 
  Volume2,
  VolumeX,
  Monitor,
  Eye,
  EyeOff,
  LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile, signOut } = useAuthStore();
  const { theme, settings, toggleTheme, updateSettings, requestNotificationPermission } = useUIStore();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [about, setAbout] = useState(user?.about || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleProfileUpdate = async () => {
    if (!displayName.trim()) {
      toast.error('Ad alanı boş olamaz');
      return;
    }

    try {
      setIsLoading(true);
      await updateProfile({
        displayName: displayName.trim(),
        about: about.trim() || 'Mevcut'
      });
      toast.success('Profil güncellendi');
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      toast.error('Profil güncellenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationPermission = async () => {
    try {
      await requestNotificationPermission();
      toast.success('Bildirim izni verildi');
    } catch (error) {
      toast.error('Bildirim izni alınamadı');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Çıkış hatası:', error);
      toast.error('Çıkış yapılamadı');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/chats')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Ayarlar
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Profil
          </h2>
          
          {/* Profile Photo */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <Avatar
                src={user?.photoURL}
                name={user?.displayName || 'Kullanıcı'}
                size="xl"
              />
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors">
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Profil fotoğrafınızı değiştirmek için tıklayın
              </p>
            </div>
          </div>

          {/* Profile Form */}
          <div className="space-y-4">
            <Input
              label="Ad"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={25}
            />
            
            <Input
              label="Hakkında"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              maxLength={139}
              placeholder="Hakkınızda bir şeyler yazın..."
            />
            
            <Button
              onClick={handleProfileUpdate}
              isLoading={isLoading}
              disabled={!displayName.trim()}
            >
              Profili Güncelle
            </Button>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Görünüm
          </h2>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {theme.mode === 'dark' ? (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Tema
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {theme.mode === 'dark' ? 'Koyu tema' : 'Açık tema'}
                </p>
              </div>
            </div>
            
            <Button
              variant="secondary"
              onClick={toggleTheme}
              leftIcon={theme.mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            >
              {theme.mode === 'dark' ? 'Açık' : 'Koyu'}
            </Button>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Bildirimler
          </h2>
          
          <div className="space-y-4">
            {/* Enable Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Bildirimleri Etkinleştir
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Yeni mesajlar için bildirim al
                  </p>
                </div>
              </div>
              
              <Button
                variant={settings.notifications.enabled ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => updateSettings({
                  notifications: {
                    ...settings.notifications,
                    enabled: !settings.notifications.enabled
                  }
                })}
              >
                {settings.notifications.enabled ? 'Açık' : 'Kapalı'}
              </Button>
            </div>

            {/* Sound */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {settings.notifications.sound ? (
                  <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <VolumeX className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Bildirim Sesi
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Mesaj geldiğinde ses çal
                  </p>
                </div>
              </div>
              
              <Button
                variant={settings.notifications.sound ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => updateSettings({
                  notifications: {
                    ...settings.notifications,
                    sound: !settings.notifications.sound
                  }
                })}
              >
                {settings.notifications.sound ? 'Açık' : 'Kapalı'}
              </Button>
            </div>

            {/* Desktop Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Monitor className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Masaüstü Bildirimleri
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tarayıcı bildirimleri göster
                  </p>
                </div>
              </div>
              
              <Button
                variant={settings.notifications.desktop ? 'primary' : 'secondary'}
                size="sm"
                onClick={handleNotificationPermission}
              >
                İzin Ver
              </Button>
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Gizlilik
          </h2>
          
          <div className="space-y-4">
            {/* Last Seen */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Son Görülme
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Kim son görülme zamanınızı görebilir
                  </p>
                </div>
              </div>
              
              <select 
                value={settings.privacy.lastSeen}
                onChange={(e) => updateSettings({
                  privacy: {
                    ...settings.privacy,
                    lastSeen: e.target.value as 'everyone' | 'contacts' | 'nobody'
                  }
                })}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1 text-sm"
              >
                <option value="everyone">Herkes</option>
                <option value="contacts">Kişilerim</option>
                <option value="nobody">Hiç kimse</option>
              </select>
            </div>

            {/* Profile Photo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Camera className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Profil Fotoğrafı
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Kim profil fotoğrafınızı görebilir
                  </p>
                </div>
              </div>
              
              <select 
                value={settings.privacy.profilePhoto}
                onChange={(e) => updateSettings({
                  privacy: {
                    ...settings.privacy,
                    profilePhoto: e.target.value as 'everyone' | 'contacts' | 'nobody'
                  }
                })}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1 text-sm"
              >
                <option value="everyone">Herkes</option>
                <option value="contacts">Kişilerim</option>
                <option value="nobody">Hiç kimse</option>
              </select>
            </div>
          </div>
        </div>

        {/* Account Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Hesap
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
              <Shield className="w-5 h-5" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Telefon Numarası
                </p>
                <p className="text-sm">
                  {user?.phone || 'Belirtilmemiş'}
                </p>
              </div>
            </div>
            
            <Button
              variant="danger"
              onClick={handleSignOut}
              leftIcon={<LogOut className="w-4 h-4" />}
              className="w-full"
            >
              Çıkış Yap
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
