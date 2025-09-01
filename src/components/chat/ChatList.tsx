import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { Chat } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Check, CheckCheck } from 'lucide-react';

export const ChatList: React.FC = () => {
  const navigate = useNavigate();
  const { chats, subscribeToChats, calculateUnreadCount, markChatAsRead } = useChatStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    console.log('ChatList: Kullanıcı için chat subscription başlatılıyor:', user.uid);
    const unsubscribe = subscribeToChats(user.uid);
    return unsubscribe;
  }, [user, subscribeToChats]);

  console.log('ChatList render edildi, chat sayısı:', chats.length);

  const getChatName = (chat: Chat) => {
    if (chat.type === 'group') {
      return chat.name || 'Grup';
    }
    
    // Direct chat için karşı tarafın adını bul
    const otherUserId = chat.members.find(id => id !== user?.uid);
    if (!otherUserId) return 'Bilinmeyen Kullanıcı';
    
    // Cache'den kullanıcı bilgisini al
    const { userCache, getUserById } = useAuthStore.getState();
    const otherUser = userCache[otherUserId];
    
    if (otherUser) {
      return otherUser.displayName;
    }
    
    // Cache'de yoksa yükle (async olarak)
    getUserById(otherUserId).catch(console.error);
    
    return `Kullanıcı ${otherUserId.slice(-4)}`;
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === 'group') {
      return chat.photoURL;
    }
    
    // Direct chat için karşı tarafın avatarını bul
    // TODO: Kullanıcı bilgilerini store'dan al
    return undefined;
  };

  const getLastMessageStatus = (chat: Chat) => {
    if (!chat.lastMessage || chat.lastMessage.from !== user?.uid) {
      return null;
    }

    // TODO: Mesaj durumunu kontrol et (delivered/read)
    const isRead = false; // Placeholder
    const isDelivered = true; // Placeholder

    if (isRead) {
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    } else if (isDelivered) {
      return <CheckCheck className="w-4 h-4 text-gray-400" />;
    } else {
      return <Check className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatLastMessageTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: tr 
      });
    }
  };

  const getLastMessageText = (chat: Chat) => {
    if (!chat.lastMessage) return 'Henüz mesaj yok';
    
    const { type, text } = chat.lastMessage;
    
    switch (type) {
      case 'image':
        return '📷 Fotoğraf';
      case 'file':
        return '📎 Dosya';
      case 'audio':
        return '🎤 Ses kaydı';
      default:
        return text || 'Mesaj';
    }
  };

  if (chats.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Henüz sohbet yok
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Yeni bir sohbet başlatın veya bir gruba katılın
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => {
            // Chat'i okundu olarak işaretle
            if (user) {
              markChatAsRead(chat.id, user.uid);
            }
            navigate(`/chats/${chat.id}`);
          }}
          className="chat-item border-b border-gray-200 dark:border-gray-700 last:border-b-0"
        >
          {/* Avatar */}
          <Avatar
            src={getChatAvatar(chat)}
            name={getChatName(chat)}
            size="md"
            isOnline={chat.type === 'direct' ? undefined : undefined} // TODO: Online durumu
          />

          {/* Chat Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {getChatName(chat)}
              </h3>
              {chat.lastMessage && (
                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                  {formatLastMessageTime(chat.lastMessage.createdAt)}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1">
                {getLastMessageStatus(chat)}
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate ml-1">
                  {getLastMessageText(chat)}
                </p>
              </div>
              
              {/* Unread Count */}
              {(() => {
                if (!user) return null;
                const unreadCount = calculateUnreadCount(chat.id, user.uid);
                if (unreadCount === 0) return null;
                
                return (
                  <div className="min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center ml-2 px-1">
                    <span className="text-xs text-white font-medium">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
