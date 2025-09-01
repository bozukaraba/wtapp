import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Smartphone } from 'lucide-react';
import { ConfirmationResult } from 'firebase/auth';
import toast from 'react-hot-toast';

interface OTPFormProps {
  phone: string;
  confirmationResult: ConfirmationResult;
  onVerify: (code: string) => Promise<void>;
  onBack: () => void;
  onResend: () => Promise<void>;
}

export const OTPForm: React.FC<OTPFormProps> = ({
  phone,
  confirmationResult,
  onVerify,
  onBack,
  onResend
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Geri sayım başlat
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Sadece rakam kabul et

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Otomatik olarak sonraki inputa geç
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Kod tamamlandığında otomatik doğrula
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const digits = pastedText.replace(/\D/g, '').slice(0, 6);
    
    if (digits.length === 6) {
      const newCode = digits.split('');
      setCode(newCode);
      handleVerify(digits);
    }
  };

  const handleVerify = async (verificationCode: string) => {
    try {
      setIsLoading(true);
      await onVerify(verificationCode);
      toast.success('Doğrulama başarılı!');
    } catch (error: any) {
      console.error('Doğrulama hatası:', error);
      
      if (error.code === 'auth/invalid-verification-code') {
        toast.error('Geçersiz doğrulama kodu');
      } else if (error.code === 'auth/code-expired') {
        toast.error('Doğrulama kodu süresi dolmuş');
      } else {
        toast.error('Doğrulama sırasında bir hata oluştu');
      }
      
      // Kodu temizle
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsLoading(true);
      await onResend();
      setCountdown(60);
      setCode(['', '', '', '', '', '']);
      toast.success('Yeni kod gönderildi');
    } catch (error) {
      console.error('Kod yeniden gönderme hatası:', error);
      toast.error('Kod gönderilirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Geri
        </Button>
      </div>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Smartphone className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Doğrulama Kodu
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          {phone} numarasına gönderilen 6 haneli kodu girin
        </p>
      </div>

      <div className="flex justify-center space-x-2 mb-6">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-primary-500 focus:outline-none"
            disabled={isLoading}
          />
        ))}
      </div>

      <div className="text-center mb-6">
        {countdown > 0 ? (
          <p className="text-gray-500 text-sm">
            Yeni kod isteyebilirsiniz: {countdown}s
          </p>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResend}
            isLoading={isLoading}
          >
            Kodu Tekrar Gönder
          </Button>
        )}
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={() => handleVerify(code.join(''))}
        isLoading={isLoading}
        disabled={code.some(digit => digit === '')}
      >
        Doğrula
      </Button>

      <p className="text-xs text-gray-500 text-center mt-4">
        SMS almadınız mı? Spam klasörünüzü kontrol edin veya kodu tekrar gönderin.
      </p>
    </div>
  );
};
