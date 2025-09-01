import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { Camera, User } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProfileSetup: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [about, setAbout] = useState(user?.about || 'Mevcut');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      toast.error('Lütfen adınızı girin');
      return;
    }

    try {
      setIsLoading(true);
      await updateProfile({
        displayName: displayName.trim(),
        about: about.trim() || 'Mevcut',
        photoURL: photoURL.trim() || undefined
      });
      toast.success('Profil başarıyla güncellendi!');
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      toast.error('Profil güncellenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    // Dosya türü kontrolü
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen bir resim dosyası seçin');
      return;
    }

    // FileReader ile preview oluştur
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoURL(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // TODO: Firebase Storage'a yükle
    // Bu kısım Firebase Storage entegrasyonu ile tamamlanacak
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Profilinizi Oluşturun
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Diğer kullanıcılar sizi nasıl görsün?
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Profil Fotoğrafı */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Avatar
              src={photoURL}
              name={displayName || 'Kullanıcı'}
              size="xl"
            />
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors">
              <Camera className="w-4 h-4 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Ad */}
        <Input
          type="text"
          placeholder="Adınız"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          label="Ad"
          className="mb-4"
          maxLength={25}
          required
        />

        {/* Hakkında */}
        <Input
          type="text"
          placeholder="Hakkınızda bir şeyler yazın..."
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          label="Hakkında"
          className="mb-6"
          maxLength={139}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={isLoading}
        >
          Profili Kaydet
        </Button>
      </form>

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
          💡 İpucu
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Profil fotoğrafınız diğer kullanıcılar tarafından görülecektir</li>
          <li>• Adınızı ve hakkında bilginizi istediğiniz zaman değiştirebilirsiniz</li>
          <li>• Bu bilgiler sadece WTApp'te kullanılacaktır</li>
        </ul>
      </div>
    </div>
  );
};
