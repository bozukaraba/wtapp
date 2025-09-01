import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { storage } from '@/lib/firebase';

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

  // Dosya yükleme
  public async uploadFile(
    file: File, 
    path: string, 
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      console.log('=== DOSYA YÜKLEME BAŞLIYOR ===');
      console.log('Dosya:', file.name);
      console.log('Boyut:', file.size, 'bytes');
      console.log('Tür:', file.type);
      console.log('Path:', path);
      
      // Storage referansı oluştur
      console.log('Storage referansı oluşturuluyor...');
      const storageRef = ref(storage, path);
      console.log('Storage referansı oluşturuldu:', storageRef.fullPath);
      
      // CORS sorununu önlemek için uploadBytesResumable kullan
      console.log('uploadBytesResumable başlatılıyor...');
      
      return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        uploadTask.on('state_changed',
          (snapshot) => {
            // Progress tracking
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload progress:', progress + '%');
            if (onProgress) {
              onProgress(progress);
            }
          },
          (error) => {
            console.error('=== DOSYA YÜKLEME HATASI ===');
            console.error('Hata detayı:', error);
            console.error('Hata kodu:', error.code);
            console.error('Hata mesajı:', error.message);
            reject(new Error(`Dosya yüklenemedi: ${error.message}`));
          },
          async () => {
            try {
              // Upload completed successfully
              console.log('Upload tamamlandı, download URL alınıyor...');
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('Download URL alındı:', downloadURL);
              
              const result = {
                url: downloadURL,
                path: path,
                size: file.size
              };
              
              console.log('=== DOSYA YÜKLEME TAMAMLANDI ===');
              console.log('Sonuç:', result);
              
              resolve(result);
            } catch (urlError) {
              console.error('Download URL alma hatası:', urlError);
              reject(new Error(`Download URL alınamadı: ${urlError}`));
            }
          }
        );
      });
    } catch (error) {
      console.error('=== DOSYA YÜKLEME BAŞLATMA HATASI ===');
      console.error('Hata detayı:', error);
      throw new Error(`Dosya yükleme başlatılamadı: ${(error as any)?.message || error}`);
    }
  }

  // Base64 resim yükleme (CORS sorununu önler)
  public async uploadImageBase64(
    file: File, 
    chatId: string, 
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      console.log('=== BASE64 RESİM YÜKLEME BAŞLIYOR ===');
      console.log('Dosya:', file.name, file.size, 'bytes');

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

      console.log('=== BASE64 RESİM YÜKLEME TAMAMLANDI ===');
      return result;
    } catch (error) {
      console.error('Base64 resim yükleme hatası:', error);
      throw error;
    }
  }

  // Resim yükleme (Firebase Storage - fallback)
  public async uploadImage(
    file: File, 
    chatId: string, 
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      console.log('Firebase Storage resim yükleme deneniyor...');
      return await this.uploadFile(file, `chats/${chatId}/images/${Date.now()}-${file.name}`, onProgress);
    } catch (error) {
      console.log('Firebase Storage başarısız, Base64\'e geçiliyor...');
      return await this.uploadImageBase64(file, chatId, userId, onProgress);
    }
  }

  // Base64 dosya yükleme (küçük dosyalar için)
  public async uploadDocumentBase64(
    file: File, 
    chatId: string, 
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      console.log('=== BASE64 DOSYA YÜKLEME BAŞLIYOR ===');
      console.log('Dosya:', file.name, file.size, 'bytes', file.type);

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

      console.log('=== BASE64 DOSYA YÜKLEME TAMAMLANDI ===');
      return result;
    } catch (error) {
      console.error('Base64 dosya yükleme hatası:', error);
      throw error;
    }
  }

  // Dosya yükleme (Firebase Storage - fallback)
  public async uploadDocument(
    file: File, 
    chatId: string, 
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      console.log('Firebase Storage dosya yükleme deneniyor...');
      return await this.uploadFile(file, `chats/${chatId}/files/${Date.now()}-${file.name}`, onProgress);
    } catch (error) {
      console.log('Firebase Storage başarısız, Base64\'e geçiliyor...');
      return await this.uploadDocumentBase64(file, chatId, userId, onProgress);
    }
  }

  // Ses kaydı yükleme (boyut limiti kaldırıldı)
  public async uploadAudio(
    audioBlob: Blob, 
    chatId: string, 
    userId: string,
    duration: number
  ): Promise<UploadResult> {
    try {
      console.log('Ses kaydı yükleme başlıyor:', audioBlob.size, 'bytes');

      // Benzersiz dosya adı oluştur
      const timestamp = Date.now();
      const fileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.webm`;
      const path = `chats/${chatId}/audio/${fileName}`;

      // Blob'u File'a çevir
      const file = new File([audioBlob], fileName, { type: 'audio/webm' });

      console.log('Ses kaydı yükleme path:', path);
      return await this.uploadFile(file, path);
    } catch (error) {
      console.error('Ses kaydı yükleme hatası:', error);
      throw error;
    }
  }

  // Dosya silme
  public async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      console.log('Dosya silindi:', path);
    } catch (error) {
      console.error('Dosya silme hatası:', error);
      throw new Error('Dosya silinemedi');
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
