import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { UserDiscovery } from '@/components/chat/UserDiscovery';
import { ArrowLeft } from 'lucide-react';

export const DiscoverPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/chats')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Kullanıcı Keşfi
          </h1>
        </div>
      </div>

      {/* Content */}
      <UserDiscovery />
    </div>
  );
};
