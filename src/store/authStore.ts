import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, query, collection, where, getDocs, addDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, AuthState } from '@/types';
import { generateUniqueUsername, generateUsernameId, formatUsername } from '@/utils/usernames';

interface AuthStore extends AuthState {
  // User cache for chat display
  userCache: Record<string, User>;
  
  // Actions
  initializeAuth: () => void;
  signInWithGoogle: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  setUserOnline: (online: boolean) => Promise<void>;
  findUserByUsername: (username: string) => Promise<User | null>;
  getUserById: (uid: string) => Promise<User | null>;
  createDirectChatByUsername: (username: string) => Promise<string>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      userCache: {},

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
                // Benzersiz username oluştur
                let uniqueUsername = '';
                let usernameId = '';
                let isUsernameUnique = false;
                let attempts = 0;
                
                while (!isUsernameUnique && attempts < 5) {
                  const baseUsername = generateUniqueUsername();
                  usernameId = generateUsernameId();
                  uniqueUsername = formatUsername(baseUsername, usernameId);
                  
                  // Username'in benzersiz olup olmadığını kontrol et
                  const usernameQuery = query(
                    collection(db, 'users'),
                    where('username', '==', uniqueUsername)
                  );
                  
                  try {
                    const usernameSnapshot = await getDocs(usernameQuery);
                    isUsernameUnique = usernameSnapshot.empty;
                    attempts++;
                  } catch (error) {
                    // Firestore hatası durumunda random username kullan
                    console.error('Username kontrolü hatası:', error);
                    isUsernameUnique = true;
                  }
                }

                // İlk kez giriş yapan kullanıcı için profil oluştur
                const newUser: User = {
                  uid: firebaseUser.uid,
                  displayName: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Misafir Kullanıcı' : 'Kullanıcı'),
                  username: uniqueUsername,
                  usernameId: usernameId,
                  photoURL: firebaseUser.photoURL || undefined,
                  phone: undefined,
                  about: firebaseUser.isAnonymous ? 'Misafir olarak katıldı' : 'Mevcut',
                  lastSeenAt: new Date(),
                  isOnline: true,
                  pushTokens: [],
                  createdAt: new Date(),
                  updatedAt: new Date()
                };

                // Undefined değerleri temizle
                const firestoreData: any = {
                  uid: firebaseUser.uid,
                  displayName: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Misafir Kullanıcı' : 'Kullanıcı'),
                  username: uniqueUsername,
                  usernameId: usernameId,
                  about: firebaseUser.isAnonymous ? 'Misafir olarak katıldı' : 'Mevcut',
                  lastSeenAt: serverTimestamp(),
                  isOnline: true,
                  pushTokens: [],
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                };

                // Optional alanları sadece değer varsa ekle
                if (firebaseUser.photoURL) {
                  firestoreData.photoURL = firebaseUser.photoURL;
                }
                if (firebaseUser.email) {
                  firestoreData.email = firebaseUser.email;
                }
                if (firebaseUser.phoneNumber) {
                  firestoreData.phone = firebaseUser.phoneNumber;
                }

                // Tüm kullanıcılar için Firestore'a kaydet (username araması için gerekli)
                try {
                  await setDoc(doc(db, 'users', firebaseUser.uid), firestoreData);
                  console.log('New user saved to Firestore:', newUser);
                } catch (error) {
                  console.error('Firestore yazma hatası:', error);
                  // Firestore hatası olsa bile devam et
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

      signUpWithEmail: async (email: string, password: string, displayName: string) => {
        try {
          set({ isLoading: true });
          
          // Email ile yeni hesap oluştur
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          
          // Benzersiz username oluştur
          let uniqueUsername = '';
          let usernameId = '';
          let isUsernameUnique = false;
          let attempts = 0;
          
          while (!isUsernameUnique && attempts < 5) {
            const baseUsername = generateUniqueUsername();
            usernameId = generateUsernameId();
            uniqueUsername = formatUsername(baseUsername, usernameId);
            
            try {
              const usernameQuery = query(
                collection(db, 'users'),
                where('username', '==', uniqueUsername)
              );
              const usernameSnapshot = await getDocs(usernameQuery);
              isUsernameUnique = usernameSnapshot.empty;
              attempts++;
            } catch (error) {
              console.error('Username kontrolü hatası:', error);
              isUsernameUnique = true;
            }
          }

          // Kullanıcı profilini Firestore'a kaydet
          const newUser: User = {
            uid: firebaseUser.uid,
            displayName: displayName.trim(),
            username: uniqueUsername,
            usernameId: usernameId,
            photoURL: undefined,
            phone: undefined,
            about: 'Mevcut',
            lastSeenAt: new Date(),
            isOnline: true,
            pushTokens: [],
            createdAt: new Date(),
            updatedAt: new Date()
          };

          // Undefined değerleri temizle
          const firestoreData: any = {
            uid: firebaseUser.uid,
            displayName: displayName.trim(),
            username: uniqueUsername,
            usernameId: usernameId,
            about: 'Mevcut',
            lastSeenAt: serverTimestamp(),
            isOnline: true,
            pushTokens: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          // Optional alanları sadece değer varsa ekle
          if (firebaseUser.photoURL) {
            firestoreData.photoURL = firebaseUser.photoURL;
          }
          if (firebaseUser.email) {
            firestoreData.email = firebaseUser.email;
          }

          await setDoc(doc(db, 'users', firebaseUser.uid), firestoreData);

          console.log('Email ile kayıt tamamlandı:', newUser);
          set({ isLoading: false });
          
          // onAuthStateChanged otomatik olarak tetiklenecek
        } catch (error: any) {
          console.error('Email kayıt hatası:', error);
          set({ isLoading: false });
          
          // Firebase hata kodlarını Türkçe'ye çevir
          let errorMessage = 'Kayıt olurken bir hata oluştu';
          
          switch (error.code) {
            case 'auth/email-already-in-use':
              errorMessage = 'Bu email adresi zaten kullanımda';
              break;
            case 'auth/invalid-email':
              errorMessage = 'Geçersiz email adresi';
              break;
            case 'auth/operation-not-allowed':
              errorMessage = 'Email/şifre girişi etkinleştirilmemiş';
              break;
            case 'auth/weak-password':
              errorMessage = 'Şifre çok zayıf (en az 6 karakter olmalı)';
              break;
            default:
              errorMessage = error.message || 'Kayıt olurken bir hata oluştu';
          }
          
          throw new Error(errorMessage);
        }
      },

      signInWithEmail: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          await signInWithEmailAndPassword(auth, email, password);
          // onAuthStateChanged otomatik olarak tetiklenecek
          set({ isLoading: false });
        } catch (error: any) {
          console.error('Email giriş hatası:', error);
          set({ isLoading: false });
          
          // Firebase hata kodlarını Türkçe'ye çevir
          let errorMessage = 'Giriş yapılırken bir hata oluştu';
          
          switch (error.code) {
            case 'auth/user-disabled':
              errorMessage = 'Bu hesap devre dışı bırakılmış';
              break;
            case 'auth/user-not-found':
              errorMessage = 'Bu email adresi ile kayıtlı kullanıcı bulunamadı';
              break;
            case 'auth/wrong-password':
              errorMessage = 'Hatalı şifre';
              break;
            case 'auth/invalid-email':
              errorMessage = 'Geçersiz email adresi';
              break;
            case 'auth/too-many-requests':
              errorMessage = 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin';
              break;
            default:
              errorMessage = error.message || 'Giriş yapılırken bir hata oluştu';
          }
          
          throw new Error(errorMessage);
        }
      },

      resetPassword: async (email: string) => {
        try {
          await sendPasswordResetEmail(auth, email);
          console.log('Şifre sıfırlama emaili gönderildi');
        } catch (error: any) {
          console.error('Şifre sıfırlama hatası:', error);
          
          let errorMessage = 'Şifre sıfırlama emaili gönderilemedi';
          
          switch (error.code) {
            case 'auth/user-not-found':
              errorMessage = 'Bu email adresi ile kayıtlı kullanıcı bulunamadı';
              break;
            case 'auth/invalid-email':
              errorMessage = 'Geçersiz email adresi';
              break;
            default:
              errorMessage = error.message || 'Şifre sıfırlama emaili gönderilemedi';
          }
          
          throw new Error(errorMessage);
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        const currentUser = auth.currentUser;
        if (!currentUser || !currentUser.email) {
          throw new Error('Kullanıcı bulunamadı');
        }

        try {
          // Mevcut şifre ile yeniden doğrulama
          const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
          await reauthenticateWithCredential(currentUser, credential);
          
          // Yeni şifreyi ayarla
          await updatePassword(currentUser, newPassword);
          
          console.log('Şifre başarıyla değiştirildi');
        } catch (error: any) {
          console.error('Şifre değiştirme hatası:', error);
          
          let errorMessage = 'Şifre değiştirilirken bir hata oluştu';
          
          switch (error.code) {
            case 'auth/wrong-password':
              errorMessage = 'Mevcut şifre hatalı';
              break;
            case 'auth/weak-password':
              errorMessage = 'Yeni şifre çok zayıf (en az 6 karakter olmalı)';
              break;
            case 'auth/requires-recent-login':
              errorMessage = 'Güvenlik nedeniyle tekrar giriş yapmanız gerekiyor';
              break;
            default:
              errorMessage = error.message || 'Şifre değiştirilirken bir hata oluştu';
          }
          
          throw new Error(errorMessage);
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
          
          // Undefined değerleri temizle
          const updateData: any = {
            updatedAt: serverTimestamp()
          };

          // Sadece tanımlı değerleri ekle
          Object.keys(data).forEach(key => {
            const value = (data as any)[key];
            if (value !== undefined && value !== null) {
              updateData[key] = value;
            }
          });

          await updateDoc(doc(db, 'users', user.uid), updateData);

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
          // Hata olsa bile local state'i güncelle
          set({ 
            user: { 
              ...user, 
              isOnline: online, 
              lastSeenAt: new Date() 
            } 
          });
        }
      },

      findUserByUsername: async (username: string) => {
        try {
          console.log('Firestore\'da aranan username:', username);
          
          const q = query(
            collection(db, 'users'),
            where('username', '==', username)
          );
          
          const snapshot = await getDocs(q);
          console.log('Firestore query sonucu:', snapshot.size, 'döküman bulundu');
          
          if (!snapshot.empty) {
            const docData = snapshot.docs[0].data();
            console.log('Ham Firestore verisi:', docData);
            
            // Firestore Timestamp'larını Date'e çevir
            const userData: User = {
              uid: docData.uid,
              displayName: docData.displayName,
              username: docData.username,
              usernameId: docData.usernameId,
              email: docData.email,
              photoURL: docData.photoURL,
              phone: docData.phone,
              about: docData.about || 'Mevcut',
              lastSeenAt: docData.lastSeenAt?.toDate ? docData.lastSeenAt.toDate() : new Date(),
              isOnline: docData.isOnline || false,
              pushTokens: docData.pushTokens || [],
              createdAt: docData.createdAt?.toDate ? docData.createdAt.toDate() : new Date(),
              updatedAt: docData.updatedAt?.toDate ? docData.updatedAt.toDate() : new Date()
            };
            
            console.log('Parse edilmiş kullanıcı verisi:', userData);
            
            // Cache'e ekle
            set((state) => ({
              userCache: {
                ...state.userCache,
                [userData.uid]: userData
              }
            }));
            
            return userData;
          }
          
          console.log('Username bulunamadı');
          return null;
        } catch (error) {
          console.error('Username ile kullanıcı arama hatası:', error);
          return null;
        }
      },

      getUserById: async (uid: string) => {
        try {
          // Önce cache'den kontrol et
          const { userCache } = get();
          if (userCache[uid]) {
            console.log('Kullanıcı cache\'den alındı:', uid);
            return userCache[uid];
          }

          console.log('Kullanıcı Firestore\'dan yükleniyor:', uid);
          
          const userDoc = await getDoc(doc(db, 'users', uid));
          
          if (userDoc.exists()) {
            const docData = userDoc.data();
            console.log('Ham kullanıcı verisi:', docData);
            
            // Firestore Timestamp'larını Date'e çevir
            const userData: User = {
              uid: docData.uid,
              displayName: docData.displayName,
              username: docData.username,
              usernameId: docData.usernameId,
              email: docData.email,
              photoURL: docData.photoURL,
              phone: docData.phone,
              about: docData.about || 'Mevcut',
              lastSeenAt: docData.lastSeenAt?.toDate ? docData.lastSeenAt.toDate() : new Date(),
              isOnline: docData.isOnline || false,
              pushTokens: docData.pushTokens || [],
              createdAt: docData.createdAt?.toDate ? docData.createdAt.toDate() : new Date(),
              updatedAt: docData.updatedAt?.toDate ? docData.updatedAt.toDate() : new Date()
            };
            
            // Cache'e ekle
            set((state) => ({
              userCache: {
                ...state.userCache,
                [userData.uid]: userData
              }
            }));
            
            console.log('Kullanıcı yüklendi ve cache\'lendi:', userData);
            return userData;
          }
          
          console.log('Kullanıcı bulunamadı:', uid);
          return null;
        } catch (error) {
          console.error('Kullanıcı ID ile arama hatası:', error);
          return null;
        }
      },

      createDirectChatByUsername: async (username: string) => {
        const { user } = get();
        if (!user) throw new Error('Kullanıcı bulunamadı');

        try {
          // Username ile kullanıcıyı bul
          const foundUser = await get().findUserByUsername(username);
          if (!foundUser) {
            throw new Error('Kullanıcı bulunamadı');
          }

          if (foundUser.uid === user.uid) {
            throw new Error('Kendinizle sohbet başlatamazsınız');
          }

          // Mevcut direkt chat'i kontrol et
          const chatQuery = query(
            collection(db, 'chats'),
            where('type', '==', 'direct'),
            where('members', 'array-contains', user.uid)
          );

          const chatSnapshot = await getDocs(chatQuery);
          const existingChat = chatSnapshot.docs.find(doc => {
            const data = doc.data();
            return data.members.includes(foundUser.uid);
          });

          if (existingChat) {
            return existingChat.id;
          }

          // Yeni direkt chat oluştur
          const chatData = {
            type: 'direct',
            members: [user.uid, foundUser.uid],
            createdAt: serverTimestamp(),
            createdBy: user.uid
          };

          const docRef = await addDoc(collection(db, 'chats'), chatData);
          return docRef.id;
        } catch (error) {
          console.error('Username ile chat oluşturma hatası:', error);
          throw error;
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


