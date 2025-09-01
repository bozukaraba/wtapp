import React, { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { ProfileSetup } from '@/components/auth/ProfileSetup';
import { useAuthStore } from '@/store/authStore';

type AuthStep = 'login' | 'profile';

export const LoginPage: React.FC = () => {
  const [step, setStep] = useState<AuthStep>('login');
  const { user } = useAuthStore();

  // Kullanıcı giriş yaptıktan sonra profil kurulumu gerekiyorsa göster
  React.useEffect(() => {
    if (user && (!user.displayName || user.displayName === 'Misafir Kullanıcı' || user.displayName === 'Kullanıcı')) {
      setStep('profile');
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      {step === 'login' && <LoginForm />}
      {step === 'profile' && <ProfileSetup />}
    </div>
  );
};
