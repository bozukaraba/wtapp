import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export interface UploadResult {
  url: string;
  path: string;
  size: number;
}

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
      console.log('Dosya yükleniyor:', file.name, 'Path:', path);
      
      // Storage referansı oluştur
      const storageRef = ref(storage, path);
      
      // Dosyayı yükle
      const snapshot = await uploadBytes(storageRef, file);
      console.log('Dosya yüklendi:', snapshot.metadata);
      
      // Download URL'ini al
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Download URL alındı:', downloadURL);
      
      return {
        url: downloadURL,
        path: path,
        size: file.size
      };
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      throw new Error('Dosya yüklenemedi');
    }
  }

  // Resim yükleme (boyut limiti kaldırıldı)
  public async uploadImage(
    file: File, 
    chatId: string, 
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      console.log('Resim yükleme başlıyor:', file.name, file.size, 'bytes');

      // Benzersiz dosya adı oluştur
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'jpg';
      const fileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.${extension}`;
      const path = `chats/${chatId}/images/${fileName}`;

      console.log('Resim yükleme path:', path);
      return await this.uploadFile(file, path, onProgress);
    } catch (error) {
      console.error('Resim yükleme hatası:', error);
      throw error;
    }
  }

  // Dosya yükleme (boyut limiti kaldırıldı)
  public async uploadDocument(
    file: File, 
    chatId: string, 
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      console.log('Dosya yükleme başlıyor:', file.name, file.size, 'bytes', file.type);

      // Benzersiz dosya adı oluştur
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'bin';
      const fileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.${extension}`;
      const path = `chats/${chatId}/files/${fileName}`;

      console.log('Dosya yükleme path:', path);
      return await this.uploadFile(file, path, onProgress);
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      throw error;
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
