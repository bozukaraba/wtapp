import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Monitor,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { clsx } from 'clsx';

interface VideoCallProps {
  isIncoming?: boolean;
  callerName?: string;
  onAccept?: () => void;
  onDecline?: () => void;
  onEnd?: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export const VideoCall: React.FC<VideoCallProps> = ({
  isIncoming = false,
  callerName = 'Bilinmeyen Kullanıcı',
  onAccept,
  onDecline,
  onEnd,
  isMinimized = false,
  onToggleMinimize
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');

  // Kamera ve mikrofon erişimi
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        setCallStatus('connected');
      } catch (error) {
        console.error('Medya erişim hatası:', error);
        setCallStatus('ended');
      }
    };

    if (!isIncoming) {
      initializeMedia();
    }
  }, [isIncoming]);

  // Video toggle
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  // Audio toggle
  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  // Screen sharing
  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        setIsScreenSharing(true);
        
        // Ekran paylaşımı bittiğinde
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
          }
        };
      } else {
        // Kameraya geri dön
        if (localVideoRef.current && localStream) {
          localVideoRef.current.srcObject = localStream;
        }
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Ekran paylaşım hatası:', error);
    }
  };

  // Call end
  const handleEndCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setCallStatus('ended');
    onEnd?.();
  };

  // Accept incoming call
  const handleAcceptCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setCallStatus('connected');
      onAccept?.();
    } catch (error) {
      console.error('Arama kabul etme hatası:', error);
      onDecline?.();
    }
  };

  // Incoming call UI
  if (isIncoming && callStatus === 'connecting') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center max-w-md w-full mx-4">
          <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-12 h-12 text-gray-400" />
          </div>
          
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            Gelen Görüntülü Arama
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {callerName} sizi arıyor...
          </p>
          
          <div className="flex justify-center space-x-4">
            <Button
              onClick={onDecline}
              variant="danger"
              size="lg"
              className="rounded-full w-16 h-16 p-0"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
            
            <Button
              onClick={handleAcceptCall}
              variant="success"
              size="lg"
              className="rounded-full w-16 h-16 p-0"
            >
              <Phone className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Call ended
  if (callStatus === 'ended') {
    return null;
  }

  // Active call UI
  return (
    <div className={clsx(
      'fixed bg-black text-white z-50 transition-all duration-300',
      isMinimized 
        ? 'bottom-4 right-4 w-80 h-60 rounded-lg shadow-lg' 
        : 'inset-0'
    )}>
      {/* Remote video (main) */}
      <div className="relative w-full h-full">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Local video (picture-in-picture) */}
        <div className={clsx(
          'absolute bg-gray-900 rounded-lg overflow-hidden',
          isMinimized 
            ? 'top-2 right-2 w-20 h-16' 
            : 'top-4 right-4 w-48 h-36'
        )}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Controls */}
        <div className={clsx(
          'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4',
          isMinimized && 'p-2'
        )}>
          <div className="flex justify-center items-center space-x-4">
            {!isMinimized && (
              <>
                {/* Video toggle */}
                <Button
                  onClick={toggleVideo}
                  variant={isVideoEnabled ? 'ghost' : 'danger'}
                  size="sm"
                  className="rounded-full w-12 h-12 p-0"
                >
                  {isVideoEnabled ? (
                    <Video className="w-5 h-5" />
                  ) : (
                    <VideoOff className="w-5 h-5" />
                  )}
                </Button>
                
                {/* Audio toggle */}
                <Button
                  onClick={toggleAudio}
                  variant={isAudioEnabled ? 'ghost' : 'danger'}
                  size="sm"
                  className="rounded-full w-12 h-12 p-0"
                >
                  {isAudioEnabled ? (
                    <Mic className="w-5 h-5" />
                  ) : (
                    <MicOff className="w-5 h-5" />
                  )}
                </Button>
                
                {/* Screen share */}
                <Button
                  onClick={toggleScreenShare}
                  variant={isScreenSharing ? 'primary' : 'ghost'}
                  size="sm"
                  className="rounded-full w-12 h-12 p-0"
                >
                  <Monitor className="w-5 h-5" />
                </Button>
              </>
            )}
            
            {/* Minimize/Maximize */}
            <Button
              onClick={onToggleMinimize}
              variant="ghost"
              size="sm"
              className="rounded-full w-12 h-12 p-0"
            >
              {isMinimized ? (
                <Maximize2 className="w-5 h-5" />
              ) : (
                <Minimize2 className="w-5 h-5" />
              )}
            </Button>
            
            {/* End call */}
            <Button
              onClick={handleEndCall}
              variant="danger"
              size="sm"
              className="rounded-full w-12 h-12 p-0"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
