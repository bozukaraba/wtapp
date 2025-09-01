export interface UploadResult {
  url: string;
  path: string;
  size: number;
}

// Base64 helper functions
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export class StorageManager {
  private static instance: StorageManager;

  private constructor() {}

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  // Base64 resim yükleme (CORS sorununu tamamen önler)
  public async uploadImageBase64(
    file: File, 
    _chatId: string, 
    _userId: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      console.log('Resim Base64 olarak yükleniyor:', file.name, file.size, 'bytes');

      if (onProgress) onProgress(10);

      // Resmi sıkıştır ve Base64'e çevir
      const base64Data = await compressImage(file, 800, 0.8);
      console.log('Resim sıkıştırıldı ve Base64\'e çevrildi');
      
      if (onProgress) onProgress(50);

      // Benzersiz ID oluştur
      const timestamp = Date.now();
      const fileId = `${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
      
      if (onProgress) onProgress(100);

      const result = {
        url: base64Data, // Base64 data URL
        path: `base64://${fileId}`,
        size: file.size
      };

      console.log('Resim yükleme tamamlandı (Base64)');
      return result;
    } catch (error) {
      console.error('Resim yükleme hatası:', error);
      throw error;
    }
  }

  // Ana resim yükleme metodu - sadece Base64 kullanır
  public async uploadImage(
    file: File, 
    chatId: string, 
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    return await this.uploadImageBase64(file, chatId, userId, onProgress);
  }

  // Base64 dosya yükleme
  public async uploadDocumentBase64(
    file: File, 
    _chatId: string, 
    _userId: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      console.log('Dosya Base64 olarak yükleniyor:', file.name, file.size, 'bytes', file.type);

      if (onProgress) onProgress(10);

      // Dosyayı Base64'e çevir
      const base64Data = await fileToBase64(file);
      console.log('Dosya Base64\'e çevrildi');
      
      if (onProgress) onProgress(50);

      // Benzersiz ID oluştur
      const timestamp = Date.now();
      const fileId = `${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
      
      if (onProgress) onProgress(100);

      const result = {
        url: base64Data, // Base64 data URL
        path: `base64://${fileId}`,
        size: file.size
      };

      console.log('Dosya yükleme tamamlandı (Base64)');
      return result;
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      throw error;
    }
  }

  // Ana dosya yükleme metodu - sadece Base64 kullanır
  public async uploadDocument(
    file: File, 
    chatId: string, 
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    return await this.uploadDocumentBase64(file, chatId, userId, onProgress);
  }

  // Ses kaydı yükleme - Base64 kullanır
  public async uploadAudio(
    audioBlob: Blob, 
    _chatId: string, 
    _userId: string,
    _duration: number
  ): Promise<UploadResult> {
    try {
      console.log('Ses kaydı Base64 olarak yükleniyor:', audioBlob.size, 'bytes');

      // Benzersiz dosya adı oluştur
      const timestamp = Date.now();
      const fileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.webm`;
      
      // Blob'u File'a çevir
      const file = new File([audioBlob], fileName, { type: 'audio/webm' });
      
      // Base64'e çevir
      const base64Data = await fileToBase64(file);
      console.log('Ses kaydı Base64\'e çevrildi');
      
      // Sonuç
      const result = {
        url: base64Data, // Base64 data URL
        path: `base64://audio-${timestamp}`,
        size: file.size
      };
      
      console.log('Ses kaydı yükleme tamamlandı (Base64)');
      return result;
    } catch (error) {
      console.error('Ses kaydı yükleme hatası:', error);
      throw error;
    }
  }

  // Dosya boyutunu formatla
  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Resim boyutlarını al
  public getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
}

// Singleton instance
export const storageManager = StorageManager.getInstance();
