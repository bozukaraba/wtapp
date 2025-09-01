// Benzersiz kullanıcı adı oluşturma sistemi

const adjectives = [
  'Neşeli', 'Akıllı', 'Cesur', 'Sakin', 'Hızlı', 'Güçlü', 'Zarif', 'Yaratık',
  'Parlak', 'Sevimli', 'Eğlenceli', 'Gizemli', 'Enerjik', 'Dostane', 'Şirin',
  'Muhteşem', 'Harika', 'Büyüleyici', 'Çekici', 'İlginç', 'Dinamik', 'Canlı',
  'Renkli', 'Sıcak', 'Tatlı', 'Hoş', 'Keyifli', 'Pozitif', 'İyimser', 'Mutlu'
];

const nouns = [
  'Aslan', 'Kartal', 'Balina', 'Panda', 'Kaplan', 'Yunus', 'Kedi', 'Köpek',
  'Tavşan', 'Sincap', 'Ayı', 'Kurt', 'Tilki', 'Penguen', 'Koala', 'Zürafa',
  'Fil', 'Maymun', 'Papağan', 'Kelebek', 'Arı', 'Karınca', 'Balık', 'Kuş',
  'Yıldız', 'Ay', 'Güneş', 'Bulut', 'Rüzgar', 'Dalga', 'Çiçek', 'Ağaç'
];

const colors = [
  'Mavi', 'Yeşil', 'Kırmızı', 'Sarı', 'Mor', 'Turuncu', 'Pembe', 'Beyaz',
  'Siyah', 'Gri', 'Kahverengi', 'Altın', 'Gümüş', 'Bronz', 'Lacivert', 'Turkuaz'
];

export function generateUniqueUsername(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 999) + 1;
  
  return `${adjective}${color}${noun}${number}`;
}

export function generateUsernameId(): string {
  // 6 haneli benzersiz ID (harfler + rakamlar)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function formatUsername(username: string, id: string): string {
  return `${username}#${id}`;
}

export function parseUsername(formattedUsername: string): { username: string; id: string } | null {
  const parts = formattedUsername.split('#');
  if (parts.length !== 2) return null;
  
  return {
    username: parts[0],
    id: parts[1]
  };
}
