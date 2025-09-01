import { create } from 'zustand';
import { 
  collection, 
  query, 
  where, 
  limit, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  getDocs,
  orderBy,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';

interface DiscoveryState {
  nearbyUsers: User[];
  randomUsers: User[];
  isDiscovering: boolean;
  userLocation: {
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
  } | null;
  discoveryPreferences: {
    enableLocation: boolean;
    maxDistance: number; // km
    ageRange: [number, number];
    interests: string[];
  };
}

interface DiscoveryStore extends DiscoveryState {
  // Actions
  startDiscovery: (userId: string) => Promise<void>;
  stopDiscovery: (userId: string) => Promise<void>;
  findRandomUsers: (userId: string) => Promise<void>;
  findNearbyUsers: (userId: string) => Promise<void>;
  requestLocation: () => Promise<void>;
  updateDiscoveryPreferences: (preferences: Partial<DiscoveryState['discoveryPreferences']>) => void;
  sendConnectionRequest: (fromUserId: string, toUserId: string) => Promise<void>;
}

export const useDiscoveryStore = create<DiscoveryStore>()((set, get) => ({
  nearbyUsers: [],
  randomUsers: [],
  isDiscovering: false,
  userLocation: null,
  discoveryPreferences: {
    enableLocation: false,
    maxDistance: 10,
    ageRange: [18, 65],
    interests: []
  },

  startDiscovery: async (userId: string) => {
    try {
      set({ isDiscovering: true });

      // Kullanıcıyı discovery pool'una ekle
      await addDoc(collection(db, 'discovery'), {
        userId,
        isActive: true,
        lastSeen: serverTimestamp(),
        location: get().userLocation,
        preferences: get().discoveryPreferences,
        createdAt: serverTimestamp()
      });

      console.log('Discovery başlatıldı');
    } catch (error) {
      console.error('Discovery başlatma hatası:', error);
      set({ isDiscovering: false });
    }
  },

  stopDiscovery: async (userId: string) => {
    try {
      // Kullanıcının discovery kaydını sil
      const q = query(
        collection(db, 'discovery'),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      snapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      set({ isDiscovering: false, nearbyUsers: [], randomUsers: [] });
      console.log('Discovery durduruldu');
    } catch (error) {
      console.error('Discovery durdurma hatası:', error);
    }
  },

  findRandomUsers: async (userId: string) => {
    try {
      // Aktif discovery kullanıcılarını bul (kendisi hariç)
      const q = query(
        collection(db, 'discovery'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const discoveryUsers: any[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId !== userId) {
          discoveryUsers.push(data);
        }
      });

      // Kullanıcı bilgilerini al
      const userPromises = discoveryUsers.map(async (discoveryUser) => {
        try {
          const userDoc = await getDocs(query(
            collection(db, 'users'),
            where('uid', '==', discoveryUser.userId),
            limit(1)
          ));
          
          if (!userDoc.empty) {
            const userData = userDoc.docs[0].data() as User;
            return {
              ...userData,
              distance: discoveryUser.location ? 
                calculateDistance(get().userLocation, discoveryUser.location) : null
            };
          }
          return null;
        } catch (error) {
          console.error('Kullanıcı bilgisi alınırken hata:', error);
          return null;
        }
      });

      const users = (await Promise.all(userPromises)).filter(Boolean) as User[];
      set({ randomUsers: users });
      
      console.log('Random kullanıcılar bulundu:', users.length);
    } catch (error) {
      console.error('Random kullanıcı bulma hatası:', error);
    }
  },

  findNearbyUsers: async (userId: string) => {
    const { userLocation, discoveryPreferences } = get();
    if (!userLocation?.latitude || !userLocation?.longitude) {
      console.log('Konum bilgisi yok, nearby users bulunamıyor');
      return;
    }

    try {
      // Yakındaki aktif kullanıcıları bul
      const q = query(
        collection(db, 'discovery'),
        where('isActive', '==', true),
        limit(20)
      );

      const snapshot = await getDocs(q);
      const nearbyDiscoveryUsers: any[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId !== userId && data.location?.latitude && data.location?.longitude) {
          const distance = calculateDistance(userLocation, data.location);
          if (distance <= discoveryPreferences.maxDistance) {
            nearbyDiscoveryUsers.push({ ...data, distance });
          }
        }
      });

      // Kullanıcı bilgilerini al
      const userPromises = nearbyDiscoveryUsers.map(async (discoveryUser) => {
        try {
          const userDoc = await getDocs(query(
            collection(db, 'users'),
            where('uid', '==', discoveryUser.userId),
            limit(1)
          ));
          
          if (!userDoc.empty) {
            const userData = userDoc.docs[0].data() as User;
            return {
              ...userData,
              distance: discoveryUser.distance
            };
          }
          return null;
        } catch (error) {
          return null;
        }
      });

      const users = (await Promise.all(userPromises)).filter(Boolean) as User[];
      
      // Mesafeye göre sırala
      users.sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));
      
      set({ nearbyUsers: users });
      console.log('Yakındaki kullanıcılar bulundu:', users.length);
    } catch (error) {
      console.error('Yakındaki kullanıcı bulma hatası:', error);
    }
  },

  requestLocation: async () => {
    try {
      // Geolocation desteği kontrolü
      if (!navigator.geolocation) {
        throw new Error('Bu tarayıcı konum servislerini desteklemiyor');
      }

      console.log('Konum izni isteniyor...');

      // İzin durumunu kontrol et
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        console.log('Mevcut konum izni durumu:', permission.state);
        
        if (permission.state === 'denied') {
          throw new Error('Konum izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.');
        }
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('Konum başarıyla alındı:', position.coords);
            resolve(position);
          },
          (error) => {
            console.error('Geolocation hatası:', error);
            let errorMessage = 'Konum alınamadı';
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Konum izni reddedildi. Tarayıcı ayarlarından izin verin.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Konum bilgisi mevcut değil.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Konum alma zaman aşımına uğradı.';
                break;
            }
            
            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy: false, // Daha hızlı yanıt için
            timeout: 15000, // 15 saniye timeout
            maximumAge: 600000 // 10 dakika cache
          }
        );
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocoding ile şehir bilgisi al (opsiyonel)
      let city = 'Bilinmeyen';
      let country = 'Türkiye';

      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=tr`
        );
        
        if (response.ok) {
          const data = await response.json();
          city = data.city || data.locality || data.principalSubdivision || 'Bilinmeyen';
          country = data.countryName || 'Türkiye';
        }
      } catch (error) {
        console.log('Reverse geocoding hatası (normal):', error);
      }

      const location = { latitude, longitude, city, country };
      set({ 
        userLocation: location,
        discoveryPreferences: {
          ...get().discoveryPreferences,
          enableLocation: true
        }
      });
      
      console.log('Konum başarıyla kaydedildi:', location);
      return location;
    } catch (error) {
      console.error('Konum alma hatası:', error);
      throw error;
    }
  },

  updateDiscoveryPreferences: (preferences) => {
    set({ 
      discoveryPreferences: { 
        ...get().discoveryPreferences, 
        ...preferences 
      } 
    });
  },

  sendConnectionRequest: async (fromUserId: string, toUserId: string) => {
    try {
      // Bağlantı isteği gönder
      await addDoc(collection(db, 'connectionRequests'), {
        from: fromUserId,
        to: toUserId,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      console.log('Bağlantı isteği gönderildi');
    } catch (error) {
      console.error('Bağlantı isteği gönderme hatası:', error);
      throw error;
    }
  }
}));

// Haversine formülü ile iki nokta arası mesafe hesaplama (km)
function calculateDistance(
  pos1: { latitude: number; longitude: number } | null,
  pos2: { latitude: number; longitude: number } | null
): number {
  if (!pos1 || !pos2) return 0;

  const R = 6371; // Dünya yarıçapı (km)
  const dLat = (pos2.latitude - pos1.latitude) * Math.PI / 180;
  const dLon = (pos2.longitude - pos1.longitude) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(pos1.latitude * Math.PI / 180) * Math.cos(pos2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // 1 ondalık basamak
}
