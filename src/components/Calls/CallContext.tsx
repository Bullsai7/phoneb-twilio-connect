
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Device } from '@twilio/voice-sdk';

interface CallContextType {
  device: Device | null;
  setDevice: (device: Device | null) => void;
  connection: any | null;
  setConnection: (connection: any | null) => void;
  isCallActive: boolean;
  setIsCallActive: (isActive: boolean) => void;
  callTo: string;
  setCallTo: (to: string) => void;
  callDuration: number;
  setCallDuration: (duration: number) => void;
  isIncomingCall: boolean;
  setIsIncomingCall: (isIncoming: boolean) => void;
  incomingCallFrom: string;
  setIncomingCallFrom: (from: string) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  isSpeakerOn: boolean;
  setIsSpeakerOn: (on: boolean) => void;
}

const CallContext = createContext<CallContextType | null>(null);

export const CallProvider = ({ children }: { children: ReactNode }) => {
  const [device, setDevice] = useState<Device | null>(null);
  const [connection, setConnection] = useState<any | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callTo, setCallTo] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingCallFrom, setIncomingCallFrom] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);

  return (
    <CallContext.Provider value={{
      device,
      setDevice,
      connection,
      setConnection,
      isCallActive,
      setIsCallActive,
      callTo,
      setCallTo,
      callDuration,
      setCallDuration,
      isIncomingCall,
      setIsIncomingCall,
      incomingCallFrom,
      setIncomingCallFrom,
      isMuted,
      setIsMuted,
      isSpeakerOn,
      setIsSpeakerOn,
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCallContext = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCallContext must be used within a CallProvider');
  }
  return context;
};
