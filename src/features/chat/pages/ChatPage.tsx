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
    loadMoreMessages 
  } = useChatStore();
  
  const { user } = useAuthStore();

  useEffect(() => {
    if (!chatId) return;

    // Chat bilgilerini bul ve aktif yap
    // TODO: Chat bilgisini store'dan al
    setActiveChat(null);

    // Mesajları dinle
    const unsubscribeMessages = subscribeToMessages(chatId);
    const unsubscribeTyping = subscribeToTyping(chatId);

    return () => {
      unsubscribeMessages();
      unsubscribeTyping();
      setActiveChat(null);
    };
  }, [chatId, subscribeToMessages, subscribeToTyping, setActiveChat]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages[chatId || '']]);

  const getChatName = () => {
    if (!activeChat) return 'Yükleniyor...';
    
    if (activeChat.type === 'group') {
      return activeChat.name || 'Grup';
    }
    
    // Direct chat için karşı tarafın adını bul
    const otherUserId = activeChat.members.find(id => id !== user?.uid);
    return `Kullanıcı ${otherUserId?.slice(-4)}`;
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

          {/* Messages */}
          {chatMessages.map((message, index) => {
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
          })}

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
