import React, { useState } from 'react';
import { ConfirmationResult } from 'firebase/auth';
import { LoginForm } from '@/components/auth/LoginForm';
import { OTPForm } from '@/components/auth/OTPForm';
import { ProfileSetup } from '@/components/auth/ProfileSetup';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

type AuthStep = 'login' | 'otp' | 'profile';

export const LoginPage: React.FC = () => {
  const [step, setStep] = useState<AuthStep>('login');
  const [phone, setPhone] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const { setupPhoneAuth, verifyPhoneCode, user } = useAuthStore();

  const handlePhoneAuth = async (phoneNumber: string) => {
    try {
      const result = await setupPhoneAuth(phoneNumber);
      setConfirmationResult(result);
      setPhone(phoneNumber);
      setStep('otp');
      toast.success('Doğrulama kodu gönderildi!');
    } catch (error: any) {
      console.error('Telefon doğrulama hatası:', error);
      
      if (error.code === 'auth/too-many-requests') {
        toast.error('Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.');
      } else if (error.code === 'auth/invalid-phone-number') {
        toast.error('Geçersiz telefon numarası');
      } else {
        toast.error('SMS gönderilemedi. Lütfen tekrar deneyin.');
      }
    }
  };

  const handleVerifyCode = async (code: string) => {
    if (!confirmationResult) return;
    
    try {
      await verifyPhoneCode(confirmationResult, code);
      
      // Yeni kullanıcı ise profil kurulumuna yönlendir
      if (!user?.displayName || user.displayName === 'Anonim Kullanıcı') {
        setStep('profile');
      }
      // Mevcut kullanıcı ise otomatik olarak yönlendirilecek
    } catch (error) {
      throw error; // OTPForm'da handle edilecek
    }
  };

  const handleResendCode = async () => {
    if (!phone) return;
    await handlePhoneAuth(phone);
  };

  const handleBack = () => {
    setStep('login');
    setConfirmationResult(null);
    setPhone('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      {step === 'login' && (
        <LoginForm onPhoneAuth={handlePhoneAuth} />
      )}
      
      {step === 'otp' && confirmationResult && (
        <OTPForm
          phone={phone}
          confirmationResult={confirmationResult}
          onVerify={handleVerifyCode}
          onBack={handleBack}
          onResend={handleResendCode}
        />
      )}
      
      {step === 'profile' && (
        <ProfileSetup />
      )}
    </div>
  );
};
