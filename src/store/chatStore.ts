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
  serverTimestamp,
  getDocs,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Chat, Message, ChatState, TypingStatus } from '@/types';

interface ChatStore extends ChatState {
  // Actions
  subscribeToChats: (userId: string) => () => void;
  subscribeToMessages: (chatId: string) => () => void;
  subscribeToTyping: (chatId: string) => () => void;
  sendMessage: (chatId: string, message: Omit<Message, 'id' | 'createdAt' | 'deliveredTo' | 'readBy'>) => Promise<void>;
  markMessageAsRead: (chatId: string, messageId: string, userId: string) => Promise<void>;
  setTyping: (chatId: string, userId: string, isTyping: boolean) => Promise<void>;
  setActiveChat: (chat: Chat | null) => void;
  loadMoreMessages: (chatId: string) => Promise<void>;
  createDirectChat: (otherUserId: string, currentUserId: string) => Promise<string>;
  createGroupChat: (name: string, members: string[], createdBy: string) => Promise<string>;
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  chats: [],
  activeChat: null,
  messages: {},
  typingUsers: {},
  isLoading: false,
  hasMore: true,
  lastVisible: null,

  subscribeToChats: (userId: string) => {
    const q = query(
      collection(db, 'chats'),
      where('members', 'array-contains', userId),
      orderBy('lastMessage.createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const chats: Chat[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        chats.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastMessage: data.lastMessage ? {
            ...data.lastMessage,
            createdAt: data.lastMessage.createdAt?.toDate() || new Date()
          } : undefined
        } as Chat);
      });
      
      set({ chats });
    });
  },

  subscribeToMessages: (chatId: string) => {
    const q = query(
      collection(db, 'messages', chatId, 'items'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const messages: Message[] = [];
      let lastVisible: QueryDocumentSnapshot<DocumentData> | null = null;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
          readBy: data.readBy?.map((read: any) => ({
            ...read,
            readAt: read.readAt?.toDate() || new Date()
          })) || []
        } as Message);
        
        if (snapshot.docs.length > 0) {
          lastVisible = snapshot.docs[snapshot.docs.length - 1];
        }
      });

      set((state) => ({
        messages: {
          ...state.messages,
          [chatId]: messages.reverse()
        },
        lastVisible,
        hasMore: messages.length === 50
      }));
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
      const message = {
        ...messageData,
        createdAt: serverTimestamp(),
        deliveredTo: [],
        readBy: []
      };

      // Mesajı ekle
      const docRef = await addDoc(collection(db, 'messages', chatId, 'items'), message);

      // Chat'in son mesajını güncelle
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: {
          id: docRef.id,
          text: messageData.text || 'Medya',
          from: messageData.from,
          createdAt: serverTimestamp(),
          type: messageData.type
        }
      });

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
      if (isTyping) {
        await updateDoc(typingRef, {
          isTyping: true,
          updatedAt: serverTimestamp()
        });
        
        // 3 saniye sonra otomatik olarak false yap
        setTimeout(async () => {
          await updateDoc(typingRef, {
            isTyping: false,
            updatedAt: serverTimestamp()
          });
        }, 3000);
      } else {
        await updateDoc(typingRef, {
          isTyping: false,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Typing durumu güncelleme hatası:', error);
    }
  },

  setActiveChat: (chat: Chat | null) => {
    set({ activeChat: chat });
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
  }
}));
