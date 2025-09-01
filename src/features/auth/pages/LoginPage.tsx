import React, { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ProfileSetup } from '@/components/auth/ProfileSetup';
import { useAuthStore } from '@/store/authStore';

type AuthStep = 'login' | 'register' | 'profile';

export const LoginPage: React.FC = () => {
  const [step, setStep] = useState<AuthStep>('login');
  const { user } = useAuthStore();

  // Kullanıcı giriş yaptıktan sonra profil kurulumu gerekiyorsa göster
  React.useEffect(() => {
    if (user) {
      // Sadece misafir kullanıcılar için profil kurulumu (opsiyonel)
      if (user.displayName === 'Misafir Kullanıcı') {
        setStep('profile');
      }
      // Email ve Google kullanıcıları direkt chat'e yönlendirilir
    }
  }, [user]);

  const handleSwitchToRegister = () => {
    setStep('register');
  };

  const handleSwitchToLogin = () => {
    setStep('login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      {step === 'login' && (
        <LoginForm onSwitchToRegister={handleSwitchToRegister} />
      )}
      
      {step === 'register' && (
        <RegisterForm onSwitchToLogin={handleSwitchToLogin} />
      )}
      
      {step === 'profile' && (
        <ProfileSetup />
      )}
    </div>
  );
};
