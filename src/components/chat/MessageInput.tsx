import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { Send, Paperclip, Mic, Image, Smile } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { storageManager } from '@/utils/storage';

interface MessageInputProps {
  chatId: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({ chatId }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  const { sendMessage, setTyping } = useChatStore();
  const { user } = useAuthStore();

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  // Handle text input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
    
    // Typing indicator
    if (user && e.target.value.trim()) {
      setTyping(chatId, user.uid, true);
    } else if (user) {
      setTyping(chatId, user.uid, false);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;

    try {
      await sendMessage(chatId, {
        chatId,
        from: user.uid,
        type: 'text',
        text: message.trim()
      });

      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      toast.error('Mesaj gönderilemedi');
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // File upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user || acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    try {
      setIsUploading(true);
      
      const isImage = file.type.startsWith('image/');
      let uploadResult;

      if (isImage) {
        // Resim yükleme
        uploadResult = await storageManager.uploadImage(file, chatId, user.uid);
        
        await sendMessage(chatId, {
          chatId,
          from: user.uid,
          type: 'image',
          fileName: file.name,
          fileSize: file.size,
          mediaType: file.type,
          mediaURL: uploadResult.url,
          text: '🖼️ Resim' // Undefined yerine varsayılan metin
        });

        toast.success('Resim gönderildi');
      } else {
        // Dosya yükleme
        uploadResult = await storageManager.uploadDocument(file, chatId, user.uid);
        
        await sendMessage(chatId, {
          chatId,
          from: user.uid,
          type: 'file',
          fileName: file.name,
          fileSize: file.size,
          mediaType: file.type,
          mediaURL: uploadResult.url,
          text: `📎 ${file.name}`
        });

        toast.success('Dosya gönderildi');
      }
    } catch (error: any) {
      console.error('Dosya yükleme hatası:', error);
      toast.error(error.message || 'Dosya gönderilemedi');
    } finally {
      setIsUploading(false);
    }
  }, [chatId, user, sendMessage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    noClick: true, // Tıklama ile dosya seçiciyi devre dışı bırak
    noKeyboard: true, // Keyboard ile dosya seçiciyi devre dışı bırak
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/*': ['.pdf', '.doc', '.docx', '.txt'],
      'audio/*': ['.mp3', '.wav', '.ogg'],
      'video/*': ['.mp4', '.webm']
    }
  });

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        
        // TODO: Firebase Storage'a yükle ve ses mesajı gönder
        console.log('Ses kaydı tamamlandı:', audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Ses kaydı başlatma hatası:', error);
      toast.error('Mikrofon erişimi reddedildi');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Emoji picker
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      {/* Drag and drop overlay - sadece drag sırasında göster */}
      {isDragActive && (
        <div 
          {...getRootProps({ className: 'absolute inset-0 bg-primary-500 bg-opacity-10 border-2 border-dashed border-primary-500 rounded-lg flex items-center justify-center z-10' })}
        >
          <div className="text-center pointer-events-none">
            <Paperclip className="w-8 h-8 text-primary-500 mx-auto mb-2" />
            <p className="text-primary-700 font-medium">Dosyayı buraya bırakın</p>
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 right-4 z-20">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
          />
        </div>
      )}

      <div {...getRootProps({ className: 'relative' })}>
        <input {...getInputProps()} style={{ display: 'none' }} />
        
        <div className="flex items-end space-x-2">
          {/* Attachment button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation(); // Event bubbling'i durdur
              fileInputRef.current?.click();
            }}
            disabled={isUploading}
            className="flex-shrink-0"
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          {/* Message input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onClick={(e) => e.stopPropagation()} // Event bubbling'i durdur
              onFocus={(e) => e.stopPropagation()} // Focus event'ini durdur
              placeholder="Mesaj yazın..."
              className={clsx(
                'w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 px-4 py-2 pr-20 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none',
                'min-h-[40px] max-h-[120px]'
              )}
              rows={1}
            />

            {/* Emoji button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation(); // Event bubbling'i durdur
                setShowEmojiPicker(!showEmojiPicker);
              }}
              className="absolute right-2 bottom-1"
            >
              <Smile className="w-5 h-5" />
            </Button>
          </div>

          {/* Send/Voice button */}
          {message.trim() ? (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleSendMessage();
              }}
              size="sm"
              className="flex-shrink-0 w-10 h-10 rounded-full p-0"
              disabled={isUploading}
            >
              <Send className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              variant={isRecording ? 'danger' : 'ghost'}
              size="sm"
              onMouseDown={(e) => {
                e.stopPropagation();
                startRecording();
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                stopRecording();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                startRecording();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                stopRecording();
              }}
              className={clsx(
                'flex-shrink-0 w-10 h-10 rounded-full p-0',
                isRecording && 'animate-pulse'
              )}
            >
              <Mic className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,application/*,audio/*,video/*"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) {
            onDrop(files);
            // Input'u temizle
            e.target.value = '';
          }
        }}
      />

      {/* Upload indicator */}
      {isUploading && (
        <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
          <div className="animate-spin w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full mr-2"></div>
          Dosya yükleniyor...
        </div>
      )}
    </div>
  );
};
