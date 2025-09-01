// Browser notification sistemi

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
}

export class NotificationManager {
  private static instance: NotificationManager;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.permission = Notification.permission;
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  // Bildirim izni iste
  public async requestPermission(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        console.log('Bu tarayıcı bildirimleri desteklemiyor');
        return false;
      }

      if (this.permission === 'granted') {
        return true;
      }

      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      console.log('Bildirim izni durumu:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Bildirim izni hatası:', error);
      return false;
    }
  }

  // Bildirim göster
  public async showNotification(options: NotificationOptions): Promise<void> {
    try {
      // İzin kontrolü
      if (this.permission !== 'granted') {
        console.log('Bildirim izni yok');
        return;
      }

      // Sayfa aktifse bildirim gösterme
      if (document.visibilityState === 'visible') {
        console.log('Sayfa aktif, bildirim gösterilmiyor');
        return;
      }

      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/pwa-192x192.png',
        badge: options.badge || '/pwa-192x192.png',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        silent: false
      });

      // Bildirime tıklanınca pencereyi odakla
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
        
        // Chat'e yönlendir
        if (options.data?.chatId) {
          window.location.href = `/chats/${options.data.chatId}`;
        }
      };

      // 5 saniye sonra otomatik kapat
      setTimeout(() => {
        notification.close();
      }, 5000);

      console.log('Bildirim gösterildi:', options.title);
    } catch (error) {
      console.error('Bildirim gösterme hatası:', error);
    }
  }

  // Mesaj bildirimi göster
  public async showMessageNotification(
    senderName: string, 
    messageText: string, 
    chatId: string,
    senderPhotoURL?: string
  ): Promise<void> {
    await this.showNotification({
      title: senderName,
      body: messageText,
      icon: senderPhotoURL || '/pwa-192x192.png',
      tag: `chat-${chatId}`,
      data: { chatId, type: 'message' },
      requireInteraction: true
    });
  }

  // Ses çal
  public playNotificationSound(): void {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(error => {
        console.log('Bildirim sesi çalınamadı:', error);
      });
    } catch (error) {
      console.log('Ses dosyası bulunamadı');
    }
  }

  // İzin durumunu kontrol et
  public hasPermission(): boolean {
    return this.permission === 'granted';
  }

  // İzin durumunu güncelle
  public updatePermission(): void {
    this.permission = Notification.permission;
  }
}

// Singleton instance
export const notificationManager = NotificationManager.getInstance();
