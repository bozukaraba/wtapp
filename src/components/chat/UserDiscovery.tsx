import React from 'react';
import { UsernameChat } from '@/components/chat/UsernameChat';
import { Users } from 'lucide-react';

export const UserDiscovery: React.FC = () => {

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Sohbet Başlat
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Kullanıcı adı paylaşarak arkadaşlarınızla sohbet edin
        </p>
      </div>

      {/* Username Chat Component */}
      <UsernameChat />
    </div>
  );
};
