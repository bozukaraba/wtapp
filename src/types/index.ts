export interface User {
  uid: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  about?: string;
  lastSeenAt: Date;
  isOnline: boolean;
  pushTokens: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  members: string[];
  createdAt: Date;
  createdBy: string;
  lastMessage?: {
    id: string;
    text: string;
    from: string;
    createdAt: Date;
    type: MessageType;
  };
  // Grup sohbetleri için
  name?: string;
  description?: string;
  photoURL?: string;
  admins?: string[];
}

export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'emoji';

export interface Message {
  id: string;
  chatId: string;
  from: string;
  type: MessageType;
  text?: string;
  mediaURL?: string;
  mediaType?: string;
  fileName?: string;
  fileSize?: number;
  replyTo?: string;
  createdAt: Date;
  updatedAt?: Date;
  deliveredTo: string[];
  readBy: Array<{
    userId: string;
    readAt: Date;
  }>;
  // Ses mesajları için
  duration?: number;
}

export interface TypingStatus {
  chatId: string;
  userId: string;
  isTyping: boolean;
  updatedAt: Date;
}

export interface NotificationPermission {
  granted: boolean;
  token?: string;
}

export interface Theme {
  mode: 'light' | 'dark';
}

export interface AppSettings {
  theme: Theme;
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
  privacy: {
    lastSeen: 'everyone' | 'contacts' | 'nobody';
    profilePhoto: 'everyone' | 'contacts' | 'nobody';
    about: 'everyone' | 'contacts' | 'nobody';
  };
}

// Store types
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, string[]>;
  isLoading: boolean;
  hasMore: boolean;
  lastVisible: any;
}

export interface UIState {
  theme: Theme;
  settings: AppSettings;
  notifications: NotificationPermission;
  isOnline: boolean;
}
