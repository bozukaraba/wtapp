import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageInput } from '@/components/chat/MessageInput';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, Phone, Video, MoreVertical, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    activeChat, 
    messages, 
    typingUsers,
    subscribeToMessages, 
    subscribeToTyping,
    setActiveChat,
    loadChatById,
    loadMoreMessages,
    markChatAsRead
  } = useChatStore();
  
  const { user } = useAuthStore();

  useEffect(() => {
    if (!chatId) return;

    const initializeChat = async () => {
      try {
        // Chat bilgilerini yükle
        const chat = await loadChatById(chatId);
        if (!chat) {
          console.error('Chat bulunamadı:', chatId);
          navigate('/chats');
          return;
        }

        // Mesajları dinle
        const unsubscribeMessages = subscribeToMessages(chatId);
        const unsubscribeTyping = subscribeToTyping(chatId);

        // Chat'i okundu olarak işaretle
        if (user) {
          markChatAsRead(chatId, user.uid);
        }

        return () => {
          unsubscribeMessages();
          unsubscribeTyping();
          setActiveChat(null);
        };
      } catch (error) {
        console.error('Chat başlatma hatası:', error);
        navigate('/chats');
      }
    };

    initializeChat();
  }, [chatId, loadChatById, subscribeToMessages, subscribeToTyping, setActiveChat, navigate]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages[chatId || '']]);

  // Debug: Mesaj durumunu loglayalım
  useEffect(() => {
    if (chatId) {
      console.log('=== CHATPAGE MESAJ DURUMU ===');
      console.log('ChatID:', chatId);
      console.log('Messages object:', messages);
      console.log('Chat messages array:', messages[chatId] || []);
      console.log('Message count:', (messages[chatId] || []).length);
    }
  }, [chatId, messages]);

  const getChatName = () => {
    if (!activeChat) return 'Yükleniyor...';
    
    if (activeChat.type === 'group') {
      return activeChat.name || 'Grup';
    }
    
    // Direct chat için karşı tarafın adını bul
    const otherUserId = activeChat.members.find(id => id !== user?.uid);
    if (!otherUserId) return 'Bilinmeyen Kullanıcı';
    
    // Cache'den kullanıcı bilgisini al
    const { userCache, getUserById } = useAuthStore.getState();
    const otherUser = userCache[otherUserId];
    
    if (otherUser) {
      return otherUser.displayName;
    }
    
    // Cache'de yoksa yükle
    getUserById(otherUserId).then(loadedUser => {
      if (loadedUser) {
        // Re-render için state güncelle (bu biraz hack ama çalışır)
        setActiveChat({ ...activeChat });
      }
    });
    
    return `Kullanıcı ${otherUserId.slice(-4)}`;
  };

  const getChatAvatar = () => {
    if (!activeChat) return undefined;
    
    if (activeChat.type === 'group') {
      return activeChat.photoURL;
    }
    
    // Direct chat için karşı tarafın avatarını bul
    return undefined;
  };

  const getOnlineStatus = () => {
    if (!activeChat || activeChat.type === 'group') return undefined;
    
    // TODO: Kullanıcının online durumunu kontrol et
    return true;
  };

  const getLastSeen = () => {
    if (!activeChat || activeChat.type === 'group') return null;
    
    // TODO: Son görülme zamanını al
    const lastSeen = new Date();
    return formatDistanceToNow(lastSeen, { addSuffix: true, locale: tr });
  };

  const getTypingUsers = () => {
    if (!chatId) return [];
    return typingUsers[chatId] || [];
  };

  const renderTypingIndicator = () => {
    const typing = getTypingUsers().filter(userId => userId !== user?.uid);
    if (typing.length === 0) return null;

    return (
      <div className="flex items-center space-x-2 px-4 py-2">
        <Avatar
          src={undefined}
          name="Typing"
          size="xs"
        />
        <div className="typing-indicator">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          yazıyor...
        </span>
      </div>
    );
  };

  if (!chatId) {
    return <div>Geçersiz sohbet</div>;
  }

  const chatMessages = messages[chatId] || [];

  return (
    <div className="h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/chats')}
            className="lg:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {/* Chat info */}
          <Avatar
            src={getChatAvatar()}
            name={getChatName()}
            size="md"
            isOnline={getOnlineStatus()}
          />
          
          <div className="flex-1 min-w-0">
            <h2 className="font-medium text-gray-900 dark:text-white truncate">
              {getChatName()}
            </h2>
            {activeChat?.type === 'group' ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {activeChat.members.length} üye
              </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getOnlineStatus() ? 'Çevrimiçi' : getLastSeen()}
              </p>
            )}
          </div>
        </div>

        {/* Header actions */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            title="Sesli arama"
          >
            <Phone className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            title="Görüntülü arama"
          >
            <Video className="w-5 h-5" />
          </Button>
          
          {activeChat?.type === 'group' && (
            <Button
              variant="ghost"
              size="sm"
              title="Grup bilgileri"
            >
              <Users className="w-5 h-5" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            title="Daha fazla"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-gray-900">
        <div className="p-4 space-y-1">
          {/* Load more button */}
          <div className="text-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadMoreMessages(chatId)}
            >
              Daha eski mesajları yükle
            </Button>
          </div>

          {/* Messages - Mesaj listesi */}
          {chatMessages.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  Henüz mesaj yok, konuşmaya başlayın!
                </p>
              </div>
            </div>
          ) : (
            chatMessages.map((message, index) => {
              const isOwn = message.from === user?.uid;
              const prevMessage = chatMessages[index - 1];
              const showAvatar = activeChat?.type === 'group' && 
                (!prevMessage || prevMessage.from !== message.from);

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  senderName={showAvatar ? `Kullanıcı ${message.from.slice(-4)}` : undefined}
                />
              );
            })
          )}

          {/* Typing indicator */}
          {renderTypingIndicator()}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <MessageInput chatId={chatId} />
    </div>
  );
};
