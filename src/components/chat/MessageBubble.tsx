import React from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Message, MessageType } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Check, CheckCheck, Download, Play, Pause } from 'lucide-react';
import { clsx } from 'clsx';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  senderName?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar = false,
  senderName
}) => {
  const formatTime = (date: Date | undefined) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return '--:--';
    }
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageStatus = () => {
    if (!isOwn) return null;

    // Güvenli array kontrolü
    const readBy = Array.isArray(message.readBy) ? message.readBy : [];
    const deliveredTo = Array.isArray(message.deliveredTo) ? message.deliveredTo : [];

    const isRead = readBy.length > 0;
    const isDelivered = deliveredTo.length > 0;

    if (isRead) {
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    } else if (isDelivered) {
      return <CheckCheck className="w-4 h-4 text-gray-400" />;
    } else {
      return <Check className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <p className="whitespace-pre-wrap break-words">
            {message.text || 'Boş mesaj'}
          </p>
        );

      case 'image':
        return (
          <div className="media-preview">
            <img
              src={message.mediaURL}
              alt="Gönderilen resim"
              className="max-w-xs max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
              loading="lazy"
              onClick={() => {
                // Resmi büyük boyutta göster
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
                modal.onclick = () => modal.remove();
                
                const img = document.createElement('img');
                img.src = message.mediaURL || '';
                img.className = 'max-w-full max-h-full object-contain rounded-lg';
                
                modal.appendChild(img);
                document.body.appendChild(modal);
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/broken-image.png'; // Placeholder için
                target.alt = 'Resim yüklenemedi';
                target.className = 'max-w-xs rounded-lg bg-gray-200 dark:bg-gray-700 p-4 text-gray-500 text-center';
              }}
            />
            {message.text && (
              <p className="mt-2 whitespace-pre-wrap break-words">
                {message.text}
              </p>
            )}
          </div>
        );

      case 'file':
        const isVideo = message.mediaType?.startsWith('video/');
        const isAudio = message.mediaType?.startsWith('audio/') && message.mediaType !== 'audio/webm'; // Exclude voice messages
        
        if (isVideo) {
          // Video dosyası için download link göster (Base64 video oynatma sorunları nedeniyle)
          return (
            <div className="file-message">
              <div className="flex items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-xs">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white mr-3">
                  <Play className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {message.fileName || 'Video dosyası'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Video • {message.fileSize ? (message.fileSize / (1024 * 1024)).toFixed(1) + ' MB' : 'Bilinmeyen boyut'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (message.mediaURL) {
                      // Base64 video'yu yeni sekmede aç
                      const newWindow = window.open();
                      if (newWindow) {
                        newWindow.document.write(`
                          <html>
                            <head><title>Video</title></head>
                            <body style="margin:0; background:#000; display:flex; justify-content:center; align-items:center; height:100vh;">
                              <video controls autoplay style="max-width:100%; max-height:100%;">
                                <source src="${message.mediaURL}" type="${message.mediaType}">
                                Tarayıcınız video oynatmayı desteklemiyor.
                              </video>
                            </body>
                          </html>
                        `);
                      }
                    }
                  }}
                  className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-full transition-colors"
                  title="Videoyu oynat"
                >
                  <Play className="w-4 h-4" />
                </button>
              </div>
              {message.text && (
                <p className="mt-2 whitespace-pre-wrap break-words">
                  {message.text}
                </p>
              )}
            </div>
          );
        } else if (isAudio) {
          return (
            <div className="audio-message">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white">
                <Play className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <audio controls className="w-full">
                  <source src={message.mediaURL} type={message.mediaType} />
                  Tarayıcınız ses oynatmayı desteklemiyor.
                </audio>
                <p className="text-xs text-gray-500 mt-1">
                  {message.fileName}
                </p>
              </div>
            </div>
          );
        } else {
          return (
            <div className="file-message">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {message.fileName || 'Dosya'}
                </p>
                {message.fileSize && (
                  <p className="text-xs text-gray-500">
                    {(message.fileSize / 1024 / 1024).toFixed(1)} MB
                  </p>
                )}
              </div>
            </div>
          );
        }

      case 'audio':
        return (
          <div className="audio-message">
            <button className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white">
              <Play className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                <div className="h-2 bg-primary-500 rounded-full w-0"></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {message.duration ? `${Math.floor(message.duration / 60)}:${(message.duration % 60).toString().padStart(2, '0')}` : '0:00'}
              </p>
            </div>
          </div>
        );

      default:
        return <p>Desteklenmeyen mesaj türü</p>;
    }
  };

  return (
    <div className={clsx(
      'flex gap-2 mb-4',
      isOwn ? 'justify-end' : 'justify-start'
    )}>
      {/* Avatar - sadece grup sohbetlerinde ve kendi mesajı değilse */}
      {showAvatar && !isOwn && (
        <Avatar
          src={undefined} // TODO: Gönderen kullanıcının avatarı
          name={senderName || 'Kullanıcı'}
          size="sm"
        />
      )}

      <div className={clsx(
        'flex flex-col',
        isOwn ? 'items-end' : 'items-start'
      )}>
        {/* Sender name - sadece grup sohbetlerinde ve kendi mesajı değilse */}
        {showAvatar && !isOwn && senderName && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
            {senderName}
          </p>
        )}

        {/* Message bubble */}
        <div className={clsx(
          'message-bubble',
          isOwn ? 'sent' : 'received',
          'relative'
        )}>
          {renderMessageContent()}

          {/* Time and status */}
          <div className={clsx(
            'flex items-center gap-1 mt-1',
            isOwn ? 'justify-end' : 'justify-start'
          )}>
            <span className="text-xs opacity-70">
              {formatTime(message.createdAt)}
            </span>
            {getMessageStatus()}
          </div>
        </div>

        {/* Reply indicator - TODO: Implement */}
        {message.replyTo && (
          <div className="text-xs text-gray-500 dark:text-gray-400 px-1 mt-1">
            Yanıtlanan mesaj
          </div>
        )}
      </div>

      {/* Spacer for own messages without avatar */}
      {isOwn && !showAvatar && (
        <div className="w-8" />
      )}
    </div>
  );
};
