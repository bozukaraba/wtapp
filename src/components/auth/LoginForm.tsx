import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { Mail, Lock, UserCheck, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  
  const { signInWithGoogle, signInAnonymously, signInWithEmail, resetPassword } = useAuthStore();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

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

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Lütfen tüm alanları doğru şekilde doldurun');
      return;
    }

    try {
      setIsLoading(true);
      await signInWithEmail(
        formData.email.trim().toLowerCase(),
        formData.password
      );
      
      toast.success('Başarıyla giriş yapıldı!');
    } catch (error: any) {
      console.error('Email giriş hatası:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      toast.success('Google ile başarıyla giriş yapıldı!');
    } catch (error) {
      console.error('Google giriş hatası:', error);
      toast.error('Google ile giriş yapılırken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    try {
      setIsLoading(true);
      await signInAnonymously();
      toast.success('Misafir olarak giriş yapıldı!');
    } catch (error) {
      console.error('Anonim giriş hatası:', error);
      toast.error('Misafir girişi yapılırken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      toast.error('Lütfen email adresinizi girin');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail.trim())) {
      toast.error('Geçerli bir email adresi girin');
      return;
    }

    try {
      await resetPassword(resetEmail.trim().toLowerCase());
      toast.success('Şifre sıfırlama emaili gönderildi!');
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      console.error('Şifre sıfırlama hatası:', error);
      toast.error(error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          WTApp'e Giriş Yapın
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Hesabınıza giriş yapın veya misafir olarak devam edin
        </p>
      </div>

      {/* Şifre Sıfırlama Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Şifremi Unuttum
            </h3>
            <Input
              type="email"
              placeholder="Email adresinizi girin"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              leftIcon={<Mail />}
              className="mb-4"
            />
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail('');
                }}
                className="flex-1"
              >
                İptal
              </Button>
              <Button
                onClick={handleForgotPassword}
                className="flex-1"
                disabled={!resetEmail.trim()}
              >
                Gönder
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Email/Şifre Giriş Formu */}
      <form onSubmit={handleEmailSignIn} className="space-y-4 mb-6">
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

        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder="Şifrenizi girin"
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
          autoComplete="current-password"
          required
        />

        {/* Şifremi Unuttum */}
        <div className="text-right">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-sm text-primary-500 hover:text-primary-600 hover:underline"
          >
            Şifremi unuttum
          </button>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={isLoading}
          disabled={!formData.email.trim() || !formData.password}
        >
          Giriş Yap
        </Button>
      </form>

      {/* Alternatif Giriş Yöntemleri */}
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">veya</span>
          </div>
        </div>

        {/* Google ile Giriş */}
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={handleGoogleSignIn}
          isLoading={isLoading}
          leftIcon={
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          }
        >
          Google ile Giriş Yap
        </Button>

        {/* Misafir Girişi */}
        <Button
          variant="ghost"
          size="lg"
          className="w-full"
          onClick={handleAnonymousSignIn}
          isLoading={isLoading}
          leftIcon={<UserCheck className="w-5 h-5" />}
        >
          Misafir Olarak Devam Et
        </Button>
      </div>

      {/* Kayıt Olmaya Geç */}
      <div className="mt-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Hesabınız yok mu?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-primary-500 hover:text-primary-600 font-medium hover:underline"
          >
            Kayıt Olun
          </button>
        </p>
      </div>

      <p className="text-xs text-gray-500 text-center mt-6">
        Devam ederek{' '}
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
