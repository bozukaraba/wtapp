import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider,
  signInAnonymously,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, AuthState } from '@/types';

interface AuthStore extends AuthState {
  // Actions
  initializeAuth: () => void;
  signInWithGoogle: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
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
        // Timeout ekle - 10 saniye sonra loading'i kapat
        const timeoutId = setTimeout(() => {
          console.log('Auth timeout, setting loading to false');
          set({ isLoading: false });
        }, 10000);

        onAuthStateChanged(auth, async (firebaseUser) => {
          clearTimeout(timeoutId); // Timeout'u iptal et
          if (firebaseUser) {
            console.log('Firebase user:', firebaseUser);
            console.log('Is anonymous:', firebaseUser.isAnonymous);
            try {
              const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
              
              if (userDoc.exists()) {
                const userData = userDoc.data() as User;
                console.log('Existing user data:', userData);
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
                  displayName: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Misafir Kullanıcı' : 'Kullanıcı'),
                  photoURL: firebaseUser.photoURL || undefined,
                  phone: undefined,
                  about: firebaseUser.isAnonymous ? 'Misafir olarak katıldı' : 'Mevcut',
                  lastSeenAt: new Date(),
                  isOnline: true,
                  pushTokens: [],
                  createdAt: new Date(),
                  updatedAt: new Date()
                };

                // Anonymous kullanıcılar için Firestore'a yazma işlemini atla
                if (!firebaseUser.isAnonymous) {
                  try {
                    await setDoc(doc(db, 'users', firebaseUser.uid), {
                      ...newUser,
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp(),
                      lastSeenAt: serverTimestamp()
                    });
                    console.log('New user saved to Firestore:', newUser);
                  } catch (error) {
                    console.error('Firestore yazma hatası:', error);
                    // Firestore hatası olsa bile devam et
                  }
                } else {
                  console.log('Anonymous user, skipping Firestore save');
                }

                console.log('New user created:', newUser);
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
            console.log('No firebase user, signing out');
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

      signInAnonymously: async () => {
        try {
          set({ isLoading: true });
          await signInAnonymously(auth);
          // onAuthStateChanged otomatik olarak tetiklenecek
          set({ isLoading: false });
        } catch (error) {
          console.error('Anonim giriş hatası:', error);
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

        // Anonymous kullanıcılar için Firestore güncellemesi yapma
        if (user.displayName === 'Misafir Kullanıcı') {
          console.log('Anonymous user, skipping online status update');
          set({ 
            user: { 
              ...user, 
              isOnline: online, 
              lastSeenAt: new Date() 
            } 
          });
          return;
        }

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
          // Hata olsa bile local state'i güncelle
          set({ 
            user: { 
              ...user, 
              isOnline: online, 
              lastSeenAt: new Date() 
            } 
          });
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


