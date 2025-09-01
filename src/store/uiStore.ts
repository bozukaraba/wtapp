import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging, vapidKey } from '@/lib/firebase';
import { UIState, Theme, AppSettings, NotificationPermission } from '@/types';

interface UIStore extends UIState {
  // Actions
  toggleTheme: () => void;
  setTheme: (theme: Theme['mode']) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  requestNotificationPermission: () => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => void;
  initializeNotifications: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  theme: { mode: 'light' },
  notifications: {
    enabled: true,
    sound: true,
    desktop: true
  },
  privacy: {
    lastSeen: 'everyone',
    profilePhoto: 'everyone',
    about: 'everyone'
  }
};

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      theme: { mode: 'light' },
      settings: defaultSettings,
      notifications: { granted: false },
      isOnline: navigator.onLine,

      toggleTheme: () => {
        const currentMode = get().theme.mode;
        const newMode = currentMode === 'light' ? 'dark' : 'light';
        
        set({ 
          theme: { mode: newMode },
          settings: {
            ...get().settings,
            theme: { mode: newMode }
          }
        });

        // DOM'a tema sınıfını uygula
        if (newMode === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      setTheme: (mode: Theme['mode']) => {
        set({ 
          theme: { mode },
          settings: {
            ...get().settings,
            theme: { mode }
          }
        });

        // DOM'a tema sınıfını uygula
        if (mode === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      updateSettings: (newSettings: Partial<AppSettings>) => {
        set({ 
          settings: { 
            ...get().settings, 
            ...newSettings 
          } 
        });
      },

      requestNotificationPermission: async () => {
        try {
          if (!messaging) {
            console.log('Firebase Messaging desteklenmiyor');
            return;
          }

          const permission = await Notification.requestPermission();
          
          if (permission === 'granted') {
            const token = await getToken(messaging, { vapidKey });
            
            set({ 
              notifications: { 
                granted: true, 
                token 
              } 
            });

            console.log('FCM Token:', token);
            return token;
          } else {
            set({ 
              notifications: { 
                granted: false 
              } 
            });
          }
        } catch (error) {
          console.error('Bildirim izni hatası:', error);
          set({ 
            notifications: { 
              granted: false 
            } 
          });
        }
      },

      initializeNotifications: async () => {
        try {
          if (!messaging) return;

          // Foreground mesajlarını dinle
          onMessage(messaging, (payload) => {
            console.log('Foreground mesaj alındı:', payload);
            
            const { settings } = get();
            
            if (settings.notifications.enabled && settings.notifications.desktop) {
              const notification = new Notification(
                payload.notification?.title || 'Yeni Mesaj',
                {
                  body: payload.notification?.body,
                  icon: payload.notification?.icon || '/pwa-192x192.png',
                  badge: '/pwa-192x192.png',
                  tag: payload.data?.chatId,
                  requireInteraction: true
                }
              );

              notification.onclick = () => {
                window.focus();
                notification.close();
                // Chat'e yönlendir
                if (payload.data?.chatId) {
                  window.location.href = `/chats/${payload.data.chatId}`;
                }
              };

              // Ses çal
              if (settings.notifications.sound) {
                const audio = new Audio('/notification-sound.mp3');
                audio.play().catch(console.error);
              }
            }
          });

          // Mevcut token'ı al
          const currentToken = await getToken(messaging, { vapidKey });
          if (currentToken) {
            set({ 
              notifications: { 
                granted: true, 
                token: currentToken 
              } 
            });
          }
        } catch (error) {
          console.error('Bildirim başlatma hatası:', error);
        }
      },

      setOnlineStatus: (isOnline: boolean) => {
        set({ isOnline });
      }
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        settings: state.settings,
        notifications: state.notifications
      }),
      onRehydrateStorage: () => (state) => {
        // Sayfa yüklendiğinde tema sınıfını uygula
        if (state?.theme.mode === 'dark') {
          document.documentElement.classList.add('dark');
        }
      }
    }
  )
);

// Online/offline durumunu izle
window.addEventListener('online', () => {
  useUIStore.getState().setOnlineStatus(true);
});

window.addEventListener('offline', () => {
  useUIStore.getState().setOnlineStatus(false);
});
