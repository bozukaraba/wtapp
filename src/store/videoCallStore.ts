import { create } from 'zustand';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CallOffer {
  id: string;
  from: string;
  to: string;
  type: 'video' | 'audio';
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  status: 'pending' | 'accepted' | 'declined' | 'ended';
  createdAt: Date;
}

interface ICECandidate {
  id: string;
  callId: string;
  candidate: RTCIceCandidateInit;
  from: string;
}

interface VideoCallState {
  // State
  currentCall: CallOffer | null;
  isInCall: boolean;
  isMinimized: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  
  // Actions
  initiateCall: (targetUserId: string, type: 'video' | 'audio') => Promise<void>;
  acceptCall: (callId: string) => Promise<void>;
  declineCall: (callId: string) => Promise<void>;
  endCall: () => Promise<void>;
  toggleMinimize: () => void;
  subscribeToIncomingCalls: (userId: string) => () => void;
  subscribeToCallUpdates: (callId: string) => () => void;
  subscribeToICECandidates: (callId: string) => () => void;
}

// WebRTC configuration
const rtcConfiguration: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useVideoCallStore = create<VideoCallState>()((set, get) => ({
  // Initial state
  currentCall: null,
  isInCall: false,
  isMinimized: false,
  localStream: null,
  remoteStream: null,
  peerConnection: null,

  // Initiate a call
  initiateCall: async (targetUserId: string, type: 'video' | 'audio') => {
    try {
      console.log('Arama başlatılıyor:', { targetUserId, type });
      
      // Create peer connection
      const peerConnection = new RTCPeerConnection(rtcConfiguration);
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
      
      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('Remote stream alındı');
        set({ remoteStream: event.streams[0] });
      };
      
      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      // Create call document
      const callId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      // Get current user from auth store
      const { useAuthStore } = await import('@/store/authStore');
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      const callData: Omit<CallOffer, 'id'> = {
        from: currentUser.uid,
        to: targetUserId,
        type,
        offer,
        status: 'pending',
        createdAt: new Date()
      };
      
      await setDoc(doc(db, 'calls', callId), {
        ...callData,
        createdAt: serverTimestamp()
      });
      
      // Update state
      set({
        currentCall: { id: callId, ...callData },
        isInCall: true,
        localStream: stream,
        peerConnection
      });
      
      // Handle ICE candidates
      peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          const candidateId = `${callId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          await setDoc(doc(db, 'iceCandidates', candidateId), {
            callId,
            candidate: event.candidate.toJSON(),
            from: currentUser.uid
            createdAt: serverTimestamp()
          });
        }
      };
      
      console.log('Arama başlatıldı:', callId);
    } catch (error) {
      console.error('Arama başlatma hatası:', error);
      throw error;
    }
  },

  // Accept incoming call
  acceptCall: async (callId: string) => {
    try {
      console.log('Arama kabul ediliyor:', callId);
      
      const { currentCall } = get();
      if (!currentCall || !currentCall.offer) {
        throw new Error('Geçersiz arama');
      }

      // Get current user from auth store
      const { useAuthStore } = await import('@/store/authStore');
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }
      
      // Create peer connection
      const peerConnection = new RTCPeerConnection(rtcConfiguration);
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: currentCall.type === 'video',
        audio: true
      });
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
      
      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('Remote stream alındı');
        set({ remoteStream: event.streams[0] });
      };
      
      // Set remote description and create answer
      await peerConnection.setRemoteDescription(currentCall.offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      // Update call document with answer
      await setDoc(doc(db, 'calls', callId), {
        answer,
        status: 'accepted'
      }, { merge: true });
      
      // Update state
      set({
        isInCall: true,
        localStream: stream,
        peerConnection,
        currentCall: { ...currentCall, answer, status: 'accepted' }
      });
      
      // Handle ICE candidates
      peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          const candidateId = `${callId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          await setDoc(doc(db, 'iceCandidates', candidateId), {
            callId,
            candidate: event.candidate.toJSON(),
            from: currentUser.uid
            createdAt: serverTimestamp()
          });
        }
      };
      
      console.log('Arama kabul edildi');
    } catch (error) {
      console.error('Arama kabul etme hatası:', error);
      throw error;
    }
  },

  // Decline call
  declineCall: async (callId: string) => {
    try {
      await setDoc(doc(db, 'calls', callId), {
        status: 'declined'
      }, { merge: true });
      
      set({ currentCall: null, isInCall: false });
    } catch (error) {
      console.error('Arama reddetme hatası:', error);
    }
  },

  // End call
  endCall: async () => {
    try {
      const { currentCall, localStream, peerConnection } = get();
      
      if (currentCall) {
        await setDoc(doc(db, 'calls', currentCall.id), {
          status: 'ended'
        }, { merge: true });
      }
      
      // Clean up streams and connections
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      if (peerConnection) {
        peerConnection.close();
      }
      
      set({
        currentCall: null,
        isInCall: false,
        isMinimized: false,
        localStream: null,
        remoteStream: null,
        peerConnection: null
      });
    } catch (error) {
      console.error('Arama sonlandırma hatası:', error);
    }
  },

  // Toggle minimize
  toggleMinimize: () => {
    set(state => ({ isMinimized: !state.isMinimized }));
  },

  // Subscribe to incoming calls
  subscribeToIncomingCalls: (userId: string) => {
    const q = query(
      collection(db, 'calls'),
      where('to', '==', userId),
      where('status', '==', 'pending')
    );

    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const callData = change.doc.data();
          const call: CallOffer = {
            id: change.doc.id,
            from: callData.from,
            to: callData.to,
            type: callData.type,
            offer: callData.offer,
            answer: callData.answer,
            status: callData.status,
            createdAt: callData.createdAt?.toDate() || new Date()
          };
          
          set({ currentCall: call });
        }
      });
    });
  },

  // Subscribe to call updates
  subscribeToCallUpdates: (callId: string) => {
    return onSnapshot(doc(db, 'calls', callId), (doc) => {
      if (doc.exists()) {
        const callData = doc.data();
        const call: CallOffer = {
          id: doc.id,
          from: callData.from,
          to: callData.to,
          type: callData.type,
          offer: callData.offer,
          answer: callData.answer,
          status: callData.status,
          createdAt: callData.createdAt?.toDate() || new Date()
        };
        
        set({ currentCall: call });
        
        // Handle answer
        const { peerConnection } = get();
        if (call.answer && peerConnection && !peerConnection.remoteDescription) {
          peerConnection.setRemoteDescription(call.answer);
        }
      }
    });
  },

  // Subscribe to ICE candidates
  subscribeToICECandidates: (callId: string) => {
    const q = query(
      collection(db, 'iceCandidates'),
      where('callId', '==', callId)
    );

    return onSnapshot(q, (snapshot) => {
      const { peerConnection } = get();
      if (!peerConnection) return;

      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const candidateData = change.doc.data();
          const candidate = new RTCIceCandidate(candidateData.candidate);
          
          try {
            await peerConnection.addIceCandidate(candidate);
          } catch (error) {
            console.error('ICE candidate ekleme hatası:', error);
          }
        }
      });
    });
  }
}));
