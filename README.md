# WTApp - WhatsApp Clone

Modern, gerçek zamanlı mesajlaşma uygulaması. React, TypeScript, Firebase ve Tailwind CSS ile geliştirilmiştir.

## 🚀 Özellikler

### ✅ Tamamlanan Özellikler
- **Authentication**: Telefon OTP ve Google ile giriş
- **Profil Yönetimi**: Kullanıcı profili oluşturma ve düzenleme
- **Gerçek Zamanlı Mesajlaşma**: 1-1 ve grup sohbetleri
- **Mesaj Türleri**: Metin, emoji, resim, dosya, ses kaydı
- **Tema Desteği**: Açık/koyu tema
- **PWA**: Progressive Web App desteği
- **Responsive Design**: Mobil ve masaüstü uyumlu
- **TypeScript**: Tam tip güvenliği

### 🔄 Geliştirme Aşamasında
- Firebase Storage entegrasyonu (medya dosyaları)
- Push bildirimleri (FCM)
- Mesaj durumları (iletildi/okundu)
- Online/offline durumu
- Typing göstergesi
- Kullanıcı arama ve grup oluşturma

## 🛠 Teknoloji Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide Icons
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Backend**: Firebase (Auth, Firestore, Storage, FCM)
- **Deployment**: Netlify
- **CI/CD**: GitHub Actions

## 📦 Kurulum

### Gereksinimler
- Node.js 18+
- npm veya pnpm
- Firebase projesi

### 1. Projeyi klonlayın
\`\`\`bash
git clone https://github.com/{{github_org_or_user}}/{{repo_name}}.git
cd wtapp
\`\`\`

### 2. Bağımlılıkları yükleyin
\`\`\`bash
npm install
\`\`\`

### 3. Environment değişkenlerini ayarlayın
\`\`\`bash
cp env.example .env.local
\`\`\`

\`.env.local\` dosyasını düzenleyip Firebase konfigürasyonunuzu ekleyin:
\`\`\`env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
\`\`\`

### 4. Firebase kurulumu

#### Firebase CLI'yi yükleyin
\`\`\`bash
npm install -g firebase-tools
\`\`\`

#### Firebase'e giriş yapın
\`\`\`bash
firebase login
\`\`\`

#### Firebase projesini başlatın
\`\`\`bash
firebase init
\`\`\`

#### Firestore kurallarını deploy edin
\`\`\`bash
firebase deploy --only firestore:rules
firebase deploy --only storage
\`\`\`

### 5. Geliştirme sunucusunu başlatın
\`\`\`bash
npm run dev
\`\`\`

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## 🧪 Test

### Unit testleri çalıştır
\`\`\`bash
npm run test
\`\`\`

### Test coverage
\`\`\`bash
npm run test:coverage
\`\`\`

### Linting
\`\`\`bash
npm run lint
\`\`\`

## 🚀 Deployment

### Netlify'a Deploy

1. **GitHub'a push edin**
   \`\`\`bash
   git push origin main
   \`\`\`

2. **Netlify'da site oluşturun**
   - GitHub repo'nuzu bağlayın
   - Build komutu: \`npm run build\`
   - Publish directory: \`dist\`

3. **Environment değişkenlerini ekleyin**
   Netlify dashboard'da Site Settings > Environment variables bölümünden Firebase konfigürasyonunuzu ekleyin.

### Firebase Hosting (Alternatif)
\`\`\`bash
npm run build
firebase deploy --only hosting
\`\`\`

## 📁 Proje Yapısı

\`\`\`
src/
├── app/                    # Ana uygulama dosyası
├── components/             # Yeniden kullanılabilir bileşenler
│   ├── ui/                # UI bileşenleri (Button, Input, etc.)
│   ├── auth/              # Authentication bileşenleri
│   └── chat/              # Chat bileşenleri
├── features/              # Özellik bazlı bileşenler
│   ├── auth/              # Authentication sayfaları
│   └── chat/              # Chat sayfaları
├── lib/                   # Kütüphaneler ve konfigürasyonlar
├── store/                 # Zustand store'ları
├── styles/                # CSS dosyaları
├── types/                 # TypeScript tip tanımları
├── utils/                 # Yardımcı fonksiyonlar
└── test/                  # Test konfigürasyonları
\`\`\`

## 🔧 Konfigürasyonlar

### Firebase Güvenlik Kuralları
- **Firestore**: \`firebase/firestore.rules\`
- **Storage**: \`firebase/storage.rules\`

### PWA Konfigürasyonu
- **Manifest**: \`public/manifest.json\`
- **Service Worker**: Vite PWA plugin tarafından otomatik oluşturulur

### CI/CD Pipeline
- **GitHub Actions**: \`.github/workflows/\`
- **Netlify**: \`netlify.toml\`

## 🤝 Katkıda Bulunma

1. Projeyi fork edin
2. Feature branch oluşturun (\`git checkout -b feature/amazing-feature\`)
3. Değişikliklerinizi commit edin (\`git commit -m 'feat: add amazing feature'\`)
4. Branch'inizi push edin (\`git push origin feature/amazing-feature\`)
5. Pull Request açın

### Commit Kuralları
[Conventional Commits](https://www.conventionalcommits.org/) standardını kullanıyoruz:
- \`feat:\` - Yeni özellik
- \`fix:\` - Bug düzeltmesi
- \`docs:\` - Dokümantasyon
- \`style:\` - Kod formatı
- \`refactor:\` - Kod refaktörü
- \`test:\` - Test ekleme/düzeltme
- \`chore:\` - Diğer değişiklikler

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🐛 Bilinen Sorunlar

- [ ] Firebase Storage entegrasyonu tamamlanmadı
- [ ] Push bildirimler henüz aktif değil
- [ ] Ses kaydı özelliği geliştirme aşamasında

## 🔮 Gelecek Planları

- [ ] End-to-end encryption
- [ ] Video/sesli arama
- [ ] Durum paylaşımı (Stories)
- [ ] Mesaj arama
- [ ] Medya galerisi
- [ ] Grup yönetimi
- [ ] Çoklu cihaz senkronizasyonu

## 📞 İletişim

Sorularınız için issue açabilir veya [email](mailto:your-email@example.com) gönderebilirsiniz.

---

⭐ Projeyi beğendiyseniz yıldız vermeyi unutmayın!
