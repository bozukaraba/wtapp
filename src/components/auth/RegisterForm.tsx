import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { signUpWithEmail } = useAuthStore();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Ad kontrolü
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Ad alanı zorunludur';
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = 'Ad en az 2 karakter olmalıdır';
    } else if (formData.displayName.trim().length > 50) {
      newErrors.displayName = 'Ad en fazla 50 karakter olabilir';
    }

    // Email kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email adresi zorunludur';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Geçerli bir email adresi girin';
    }

    // Şifre kontrolü
    if (!formData.password) {
      newErrors.password = 'Şifre zorunludur';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır';
    } else if (formData.password.length > 128) {
      newErrors.password = 'Şifre en fazla 128 karakter olabilir';
    }

    // Şifre tekrar kontrolü
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifre tekrarı zorunludur';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Hata varsa temizle
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Lütfen tüm alanları doğru şekilde doldurun');
      return;
    }

    try {
      setIsLoading(true);
      await signUpWithEmail(
        formData.email.trim().toLowerCase(),
        formData.password,
        formData.displayName.trim()
      );
      
      toast.success('Hesabınız başarıyla oluşturuldu!');
      
      // Form'u temizle
      setFormData({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Kayıt hatası:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Hesap Oluştur
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          WTApp'e katılın ve mesajlaşmaya başlayın
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Ad */}
        <Input
          type="text"
          placeholder="Adınız Soyadınız"
          value={formData.displayName}
          onChange={(e) => handleInputChange('displayName', e.target.value)}
          leftIcon={<User />}
          label="Ad Soyad"
          error={errors.displayName}
          maxLength={50}
          required
        />

        {/* Email */}
        <Input
          type="email"
          placeholder="ornek@email.com"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          leftIcon={<Mail />}
          label="Email Adresi"
          error={errors.email}
          autoComplete="email"
          required
        />

        {/* Şifre */}
        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder="En az 6 karakter"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          leftIcon={<Lock />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          }
          label="Şifre"
          error={errors.password}
          autoComplete="new-password"
          minLength={6}
          maxLength={128}
          required
        />

        {/* Şifre Tekrar */}
        <Input
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="Şifrenizi tekrar girin"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          leftIcon={<Lock />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          }
          label="Şifre Tekrar"
          error={errors.confirmPassword}
          autoComplete="new-password"
          required
        />

        {/* Kayıt Ol Butonu */}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={isLoading}
          disabled={!formData.displayName.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword}
        >
          Hesap Oluştur
        </Button>
      </form>

      {/* Giriş Yapmaya Geç */}
      <div className="mt-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Zaten hesabınız var mı?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-primary-500 hover:text-primary-600 font-medium hover:underline"
          >
            Giriş Yapın
          </button>
        </p>
      </div>

      {/* Şifre Gereksinimleri */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
          📋 Şifre Gereksinimleri
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li className={formData.password.length >= 6 ? 'text-green-600 dark:text-green-400' : ''}>
            • En az 6 karakter
          </li>
          <li className={formData.password !== formData.confirmPassword || !formData.confirmPassword ? '' : 'text-green-600 dark:text-green-400'}>
            • Şifre tekrarı eşleşmeli
          </li>
          <li>• Güçlü şifre için rakam ve özel karakter kullanın</li>
        </ul>
      </div>

      <p className="text-xs text-gray-500 text-center mt-6">
        Hesap oluşturarak{' '}
        <a href="#" className="text-primary-500 hover:underline">
          Kullanım Şartları
        </a>{' '}
        ve{' '}
        <a href="#" className="text-primary-500 hover:underline">
          Gizlilik Politikası
        </a>
        'nı kabul etmiş olursunuz.
      </p>
    </div>
  );
};
