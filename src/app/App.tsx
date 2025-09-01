import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Pages
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ChatListPage } from '@/features/chat/pages/ChatListPage';
import { ChatPage } from '@/features/chat/pages/ChatPage';
import { SettingsPage } from '@/features/auth/pages/SettingsPage';

// Stores
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

// Components
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Styles
import '@/styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 dakika
      cacheTime: 10 * 60 * 1000, // 10 dakika
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { isLoading, isAuthenticated, initializeAuth } = useAuthStore();
  const { initializeNotifications, theme } = useUIStore();

  useEffect(() => {
    // Auth durumunu başlat
    initializeAuth();
    
    // Bildirimleri başlat
    initializeNotifications();
    
    // Tema sınıfını uygula
    if (theme.mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [initializeAuth, initializeNotifications, theme.mode]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Routes>
              {/* Public Routes */}
              <Route 
                path="/login" 
                element={
                  isAuthenticated ? <Navigate to="/chats" replace /> : <LoginPage />
                } 
              />

              {/* Protected Routes */}
              <Route path="/" element={<ProtectedRoute />}>
                <Route index element={<Navigate to="/chats" replace />} />
                <Route path="chats" element={<ChatListPage />} />
                <Route path="chats/:chatId" element={<ChatPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Global Toast Notifications */}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: theme.mode === 'dark' ? '#374151' : '#ffffff',
                  color: theme.mode === 'dark' ? '#f3f4f6' : '#111827',
                  border: `1px solid ${theme.mode === 'dark' ? '#4b5563' : '#e5e7eb'}`,
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
