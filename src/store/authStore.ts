import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, AuthState } from '@/types';

interface AuthStore extends AuthState {
  // Actions
  initializeAuth: () => void;
  signInWithGoogle: () => Promise<void>;
  setupPhoneAuth: (phoneNumber: string) => Promise<ConfirmationResult>;
  verifyPhoneCode: (confirmationResult: ConfirmationResult, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  setUserOnline: (online: boolean) => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      initializeAuth: () => {
        onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            try {
              const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
              
              if (userDoc.exists()) {
                const userData = userDoc.data() as User;
                set({ 
                  user: userData, 
                  isAuthenticated: true, 
                  isLoading: false 
                });
                
                // Kullanıcıyı online yap
                await get().setUserOnline(true);
              } else {
                // İlk kez giriş yapan kullanıcı için profil oluştur
                const newUser: User = {
                  uid: firebaseUser.uid,
                  displayName: firebaseUser.displayName || 'Anonim Kullanıcı',
                  photoURL: firebaseUser.photoURL || undefined,
                  phone: firebaseUser.phoneNumber || undefined,
                  about: 'Mevcut',
                  lastSeenAt: new Date(),
                  isOnline: true,
                  pushTokens: [],
                  createdAt: new Date(),
                  updatedAt: new Date()
                };

                await setDoc(doc(db, 'users', firebaseUser.uid), {
                  ...newUser,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                  lastSeenAt: serverTimestamp()
                });

                set({ 
                  user: newUser, 
                  isAuthenticated: true, 
                  isLoading: false 
                });
              }
            } catch (error) {
              console.error('Kullanıcı verisi alınırken hata:', error);
              set({ isLoading: false });
            }
          } else {
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false 
            });
          }
        });
      },

      signInWithGoogle: async () => {
        try {
          set({ isLoading: true });
          const provider = new GoogleAuthProvider();
          await signInWithPopup(auth, provider);
          // onAuthStateChanged otomatik olarak tetiklenecek
        } catch (error) {
          console.error('Google ile giriş hatası:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      setupPhoneAuth: async (phoneNumber: string) => {
        try {
          set({ isLoading: true });
          
          // Test numaraları için özel işlem
          const testNumbers = ['+905551234567', '+905559876543', '+905551111111'];
          if (testNumbers.includes(phoneNumber)) {
            // Test numarası için mock confirmation result
            const mockConfirmationResult = {
              confirm: async (code: string) => {
                if (code === '123456') {
                  // Mock user credential
                  return Promise.resolve({
                    user: {
                      uid: 'test-user-' + Date.now(),
                      phoneNumber: phoneNumber,
                      displayName: 'Test Kullanıcı'
                    }
                  });
                } else {
                  throw new Error('auth/invalid-verification-code');
                }
              }
            };
            set({ isLoading: false });
            return mockConfirmationResult as any;
          }
          
          // Recaptcha verifier oluştur
          if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
              size: 'invisible',
              callback: () => {
                // reCAPTCHA solved
              }
            });
          }

          const confirmationResult = await signInWithPhoneNumber(
            auth, 
            phoneNumber, 
            window.recaptchaVerifier
          );
          
          set({ isLoading: false });
          return confirmationResult;
        } catch (error) {
          console.error('Telefon doğrulama hatası:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      verifyPhoneCode: async (confirmationResult: ConfirmationResult, code: string) => {
        try {
          set({ isLoading: true });
          await confirmationResult.confirm(code);
          // onAuthStateChanged otomatik olarak tetiklenecek
        } catch (error) {
          console.error('Kod doğrulama hatası:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      signOut: async () => {
        try {
          set({ isLoading: true });
          
          // Kullanıcıyı offline yap
          await get().setUserOnline(false);
          
          await firebaseSignOut(auth);
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        } catch (error) {
          console.error('Çıkış hatası:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      updateProfile: async (data: Partial<User>) => {
        const { user } = get();
        if (!user) throw new Error('Kullanıcı bulunamadı');

        try {
          const updatedUser = { ...user, ...data, updatedAt: new Date() };
          
          await updateDoc(doc(db, 'users', user.uid), {
            ...data,
            updatedAt: serverTimestamp()
          });

          set({ user: updatedUser });
        } catch (error) {
          console.error('Profil güncelleme hatası:', error);
          throw error;
        }
      },

      setUserOnline: async (online: boolean) => {
        const { user } = get();
        if (!user) return;

        try {
          await updateDoc(doc(db, 'users', user.uid), {
            isOnline: online,
            lastSeenAt: serverTimestamp()
          });

          set({ 
            user: { 
              ...user, 
              isOnline: online, 
              lastSeenAt: new Date() 
            } 
          });
        } catch (error) {
          console.error('Online durum güncelleme hatası:', error);
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

// Global window type declaration
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}
