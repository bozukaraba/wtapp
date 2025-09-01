import { create } from 'zustand';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  setDoc,
  serverTimestamp,
  getDocs,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Chat, Message, ChatState, TypingStatus } from '@/types';
import { notificationManager } from '@/utils/notifications';

interface ChatStore extends ChatState {
  // Actions
  subscribeToChats: (userId: string) => () => void;
  subscribeToMessages: (chatId: string) => () => void;
  subscribeToTyping: (chatId: string) => () => void;
  sendMessage: (chatId: string, message: Omit<Message, 'id' | 'createdAt' | 'deliveredTo' | 'readBy'>) => Promise<void>;
  markMessageAsRead: (chatId: string, messageId: string, userId: string) => Promise<void>;
  markChatAsRead: (chatId: string, userId: string) => Promise<void>;
  calculateUnreadCount: (chatId: string, userId: string) => number;
  setTyping: (chatId: string, userId: string, isTyping: boolean) => Promise<void>;
  setActiveChat: (chat: Chat | null) => void;
  loadChatById: (chatId: string) => Promise<Chat | null>;
  loadMoreMessages: (chatId: string) => Promise<void>;
  createDirectChat: (otherUserId: string, currentUserId: string) => Promise<string>;
  createGroupChat: (name: string, members: string[], createdBy: string) => Promise<string>;
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  chats: [],
  activeChat: null,
  messages: {},
  typingUsers: {},
  unreadCounts: {},
  isLoading: false,
  hasMore: true,
  lastVisible: null,

  subscribeToChats: (userId: string) => {
    console.log('Chat listesini dinlemeye başlıyor:', userId);
    
    const q = query(
      collection(db, 'chats'),
      where('members', 'array-contains', userId)
    );

    return onSnapshot(q, (snapshot) => {
      console.log('Chat snapshot alındı:', snapshot.size, 'chat');
      
      const chats: Chat[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Ham chat verisi:', data);
        
        const chat: Chat = {
          id: doc.id,
          type: data.type,
          members: data.members,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          createdBy: data.createdBy,
          name: data.name,
          description: data.description,
          photoURL: data.photoURL,
          admins: data.admins,
          lastMessage: data.lastMessage ? {
            id: data.lastMessage.id,
            text: data.lastMessage.text,
            from: data.lastMessage.from,
            createdAt: data.lastMessage.createdAt?.toDate ? data.lastMessage.createdAt.toDate() : new Date(),
            type: data.lastMessage.type
          } : undefined
        };
        
        chats.push(chat);
      });
      
      // Son mesaja göre sırala
      chats.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt || a.createdAt;
        const bTime = b.lastMessage?.createdAt || b.createdAt;
        return bTime.getTime() - aTime.getTime();
      });
      
      console.log('Parse edilmiş chat listesi:', chats);
      set({ chats });
    }, (error) => {
      console.error('Chat dinleme hatası:', error);
    });
  },

  subscribeToMessages: (chatId: string) => {
    console.log('Mesajları dinlemeye başlıyor:', chatId);
    
    const q = query(
      collection(db, 'messages', chatId, 'items'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      console.log('Mesaj snapshot alındı:', snapshot.size, 'mesaj');
      
      const messages: Message[] = [];
      let lastVisible: QueryDocumentSnapshot<DocumentData> | null = null;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Ham mesaj verisi:', data);
        
        const message: Message = {
          id: doc.id,
          chatId: data.chatId || chatId,
          from: data.from,
          type: data.type,
          text: data.text,
          mediaURL: data.mediaURL,
          mediaType: data.mediaType,
          fileName: data.fileName,
          fileSize: data.fileSize,
          replyTo: data.replyTo,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined,
          deliveredTo: data.deliveredTo || [],
          readBy: data.readBy?.map((read: any) => ({
            userId: read.userId,
            readAt: read.readAt?.toDate ? read.readAt.toDate() : new Date()
          })) || [],
          duration: data.duration
        };
        
        messages.push(message);
        
        if (snapshot.docs.length > 0) {
          lastVisible = snapshot.docs[snapshot.docs.length - 1];
        }
      });

      const sortedMessages = messages.reverse();
      console.log('Parse edilmiş mesajlar:', sortedMessages);

      // Yeni mesaj bildirimi kontrolü
      const currentMessages = get().messages[chatId] || [];
      const newMessages = sortedMessages.filter(msg => 
        !currentMessages.some(existing => existing.id === msg.id)
      );

      // Unread count güncelle ve bildirim göster
      const currentUserId = JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.user?.uid;
      
      newMessages.forEach(async (message) => {
        // Kendi mesajı değilse unread count artır
        if (message.from !== currentUserId) {
          set((state) => ({
            unreadCounts: {
              ...state.unreadCounts,
              [chatId]: (state.unreadCounts[chatId] || 0) + 1
            }
          }));

          // Sayfa aktif değilse bildirim göster
          if (document.visibilityState !== 'visible') {
            try {
              // Gönderen kullanıcının bilgilerini al
              const { getUserById } = await import('@/store/authStore');
              const { useAuthStore } = await import('@/store/authStore');
              const sender = await useAuthStore.getState().getUserById(message.from);
              
              const senderName = sender?.displayName || 'Bilinmeyen Kullanıcı';
              const messageText = message.type === 'text' ? 
                (message.text || 'Mesaj') : 
                `📎 ${message.type === 'image' ? 'Fotoğraf' : 
                       message.type === 'audio' ? 'Ses kaydı' :
                       message.type === 'file' ? 'Dosya' : 'Medya'}`;

              await notificationManager.showMessageNotification(
                senderName,
                messageText,
                chatId,
                sender?.photoURL
              );

              // Ses çal
              notificationManager.playNotificationSound();
            } catch (error) {
              console.error('Bildirim gösterme hatası:', error);
            }
          }
        }
      });

      set((state) => ({
        messages: {
          ...state.messages,
          [chatId]: sortedMessages
        },
        lastVisible,
        hasMore: messages.length === 50
      }));
    }, (error) => {
      console.error('Mesaj dinleme hatası:', error);
    });
  },

  subscribeToTyping: (chatId: string) => {
    const q = query(collection(db, 'typing', chatId, 'users'));

    return onSnapshot(q, (snapshot) => {
      const typingUsers: string[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as TypingStatus;
        if (data.isTyping) {
          typingUsers.push(data.userId);
        }
      });

      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [chatId]: typingUsers
        }
      }));
    });
  },

  sendMessage: async (chatId: string, messageData: Omit<Message, 'id' | 'createdAt' | 'deliveredTo' | 'readBy'>) => {
    try {
      console.log('Mesaj gönderiliyor:', messageData);
      
      // Undefined değerleri temizle
      const cleanMessageData: any = {
        chatId: messageData.chatId,
        from: messageData.from,
        type: messageData.type,
        createdAt: serverTimestamp(),
        deliveredTo: [],
        readBy: []
      };

      // Sadece tanımlı alanları ekle
      if (messageData.text !== undefined && messageData.text !== null) {
        cleanMessageData.text = messageData.text;
      }
      if (messageData.mediaURL !== undefined && messageData.mediaURL !== null) {
        cleanMessageData.mediaURL = messageData.mediaURL;
      }
      if (messageData.mediaType !== undefined && messageData.mediaType !== null) {
        cleanMessageData.mediaType = messageData.mediaType;
      }
      if (messageData.fileName !== undefined && messageData.fileName !== null) {
        cleanMessageData.fileName = messageData.fileName;
      }
      if (messageData.fileSize !== undefined && messageData.fileSize !== null) {
        cleanMessageData.fileSize = messageData.fileSize;
      }
      if (messageData.replyTo !== undefined && messageData.replyTo !== null) {
        cleanMessageData.replyTo = messageData.replyTo;
      }
      if (messageData.duration !== undefined && messageData.duration !== null) {
        cleanMessageData.duration = messageData.duration;
      }

      console.log('Temizlenmiş mesaj verisi:', cleanMessageData);

      // Mesajı ekle
      const docRef = await addDoc(collection(db, 'messages', chatId, 'items'), cleanMessageData);
      console.log('Mesaj eklendi, ID:', docRef.id);

      // Chat'in son mesajını güncelle
      const lastMessageData = {
        id: docRef.id,
        text: messageData.text || (messageData.type === 'image' ? '🖼️ Resim' : 
              messageData.type === 'file' ? '📎 Dosya' : 
              messageData.type === 'audio' ? '🎤 Ses kaydı' : 'Medya'),
        from: messageData.from,
        createdAt: serverTimestamp(),
        type: messageData.type
      };

      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: lastMessageData
      });
      console.log('Chat son mesajı güncellendi');

      // Typing durumunu temizle
      await get().setTyping(chatId, messageData.from, false);
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      throw error;
    }
  },

  markMessageAsRead: async (chatId: string, messageId: string, userId: string) => {
    try {
      const messageRef = doc(db, 'messages', chatId, 'items', messageId);
      await updateDoc(messageRef, {
        [`readBy.${userId}`]: {
          userId,
          readAt: serverTimestamp()
        }
      });
    } catch (error) {
      console.error('Mesaj okundu işaretleme hatası:', error);
    }
  },

  setTyping: async (chatId: string, userId: string, isTyping: boolean) => {
    try {
      const typingRef = doc(db, 'typing', chatId, 'users', userId);
      
      const typingData = {
        userId,
        chatId,
        isTyping,
        updatedAt: serverTimestamp()
      };
      
      if (isTyping) {
        await setDoc(typingRef, typingData);
        
        // 3 saniye sonra otomatik olarak false yap
        setTimeout(async () => {
          try {
            await setDoc(typingRef, {
              ...typingData,
              isTyping: false,
              updatedAt: serverTimestamp()
            });
          } catch (error) {
            console.error('Auto typing false hatası:', error);
          }
        }, 3000);
      } else {
        await setDoc(typingRef, typingData);
      }
    } catch (error) {
      console.error('Typing durumu güncelleme hatası:', error);
    }
  },

  setActiveChat: (chat: Chat | null) => {
    set({ activeChat: chat });
  },

  loadChatById: async (chatId: string) => {
    try {
      console.log('Chat yükleniyor:', chatId);
      
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      
      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        console.log('Ham chat verisi:', chatData);
        
        const chat: Chat = {
          id: chatDoc.id,
          type: chatData.type,
          members: chatData.members,
          createdAt: chatData.createdAt?.toDate ? chatData.createdAt.toDate() : new Date(),
          createdBy: chatData.createdBy,
          name: chatData.name,
          description: chatData.description,
          photoURL: chatData.photoURL,
          admins: chatData.admins,
          lastMessage: chatData.lastMessage ? {
            ...chatData.lastMessage,
            createdAt: chatData.lastMessage.createdAt?.toDate ? chatData.lastMessage.createdAt.toDate() : new Date()
          } : undefined
        };
        
        console.log('Parse edilmiş chat:', chat);
        set({ activeChat: chat });
        return chat;
      }
      
      console.log('Chat bulunamadı');
      return null;
    } catch (error) {
      console.error('Chat yükleme hatası:', error);
      return null;
    }
  },

  loadMoreMessages: async (chatId: string) => {
    const { lastVisible, hasMore } = get();
    if (!hasMore || !lastVisible) return;

    try {
      set({ isLoading: true });
      
      const q = query(
        collection(db, 'messages', chatId, 'items'),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const newMessages: Message[] = [];
      let newLastVisible: QueryDocumentSnapshot<DocumentData> | null = null;

      snapshot.forEach((doc) => {
        const data = doc.data();
        newMessages.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
          readBy: data.readBy?.map((read: any) => ({
            ...read,
            readAt: read.readAt?.toDate() || new Date()
          })) || []
        } as Message);
      });

      if (snapshot.docs.length > 0) {
        newLastVisible = snapshot.docs[snapshot.docs.length - 1];
      }

      set((state) => ({
        messages: {
          ...state.messages,
          [chatId]: [...newMessages.reverse(), ...(state.messages[chatId] || [])]
        },
        lastVisible: newLastVisible,
        hasMore: newMessages.length === 50,
        isLoading: false
      }));
    } catch (error) {
      console.error('Daha fazla mesaj yükleme hatası:', error);
      set({ isLoading: false });
    }
  },

  createDirectChat: async (otherUserId: string, currentUserId: string) => {
    try {
      // Mevcut direkt chat'i kontrol et
      const q = query(
        collection(db, 'chats'),
        where('type', '==', 'direct'),
        where('members', 'array-contains', currentUserId)
      );

      const snapshot = await getDocs(q);
      const existingChat = snapshot.docs.find(doc => {
        const data = doc.data();
        return data.members.includes(otherUserId);
      });

      if (existingChat) {
        return existingChat.id;
      }

      // Yeni direkt chat oluştur
      const chatData = {
        type: 'direct',
        members: [currentUserId, otherUserId],
        createdAt: serverTimestamp(),
        createdBy: currentUserId
      };

      const docRef = await addDoc(collection(db, 'chats'), chatData);
      return docRef.id;
    } catch (error) {
      console.error('Direkt chat oluşturma hatası:', error);
      throw error;
    }
  },

  createGroupChat: async (name: string, members: string[], createdBy: string) => {
    try {
      const chatData = {
        type: 'group',
        name,
        members: [...members, createdBy],
        admins: [createdBy],
        createdAt: serverTimestamp(),
        createdBy
      };

      const docRef = await addDoc(collection(db, 'chats'), chatData);
      return docRef.id;
    } catch (error) {
      console.error('Grup chat oluşturma hatası:', error);
      throw error;
    }
  },

  calculateUnreadCount: (chatId: string, userId: string) => {
    const state = get();
    return state.unreadCounts[chatId] || 0;
  },

  markChatAsRead: async (chatId: string, userId: string) => {
    try {
      // Unread count'u sıfırla
      set((state) => ({
        unreadCounts: {
          ...state.unreadCounts,
          [chatId]: 0
        }
      }));

      // Tüm okunmamış mesajları okundu olarak işaretle
      const messages = get().messages[chatId] || [];
      const unreadMessages = messages.filter(msg => 
        msg.from !== userId && !msg.readBy?.some(read => read.userId === userId)
      );

      for (const message of unreadMessages) {
        await get().markMessageAsRead(chatId, message.id, userId);
      }
    } catch (error) {
      console.error('Chat okundu işaretleme hatası:', error);
    }
  }
}));
