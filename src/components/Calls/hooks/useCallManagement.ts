import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useCallContext } from '../CallContext';
import { PermissionStatus } from './useAudioPermissions';

export const useCallManagement = (micPermission: PermissionStatus, isTwilioSetup: boolean) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const { session } = useSupabaseAuth();
  const {
    connection,
    setConnection,
    setIsCallActive,
    setCallTo,
    setCallDuration,
    setIsIncomingCall,
    setIsMuted,
    setIsSpeakerOn,
    callDuration
  } = useCallContext();

  const startCallTimer = () => {
    const interval = setInterval(() => {
      // Directly set the incremented value instead of using a callback function
      setCallDuration(callDuration + 1);
    }, 1000);
    // @ts-ignore
    window.callInterval = interval;
  };

  const stopCallTimer = () => {
    // @ts-ignore
    if (window.callInterval) {
      // @ts-ignore
      clearInterval(window.callInterval);
      // @ts-ignore
      window.callInterval = null;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  const startCall = async (phoneNumber: string) => {
    setErrorDetails(null);
    
    if (micPermission !== 'granted') {
      toast.error("Microphone access is required to make calls");
      return false;
    }
    
    const numericValue = phoneNumber.replace(/\D/g, '');
    if (numericValue.length < 10) {
      toast.error("Please enter a valid phone number");
      return false;
    }

    if (!isTwilioSetup) {
      toast.error("Please set up your Twilio credentials in the settings first");
      return false;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('make-call', {
        body: { to: numericValue },
        headers: session?.access_token 
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined
      });
      
      if (error) throw new Error(error.message || "Failed to connect to call service");
      if (!data?.success) throw new Error(data?.error || "Failed to initiate call");
      
      setIsCallActive(true);
      setCallTo(phoneNumber);
      setCallDuration(0);
      startCallTimer();
      toast.success(`Calling ${phoneNumber}...`);
      return true;
      
    } catch (error: any) {
      console.error('Error making call:', error);
      const errorMessage = error.message || "Failed to make call";
      
      if (errorMessage.includes("Twilio credentials not found")) {
        setErrorDetails("Twilio credentials are missing or invalid. Please check your settings.");
      } else if (errorMessage.includes("Invalid token")) {
        setErrorDetails("Your session has expired. Please sign in again.");
      } else {
        setErrorDetails(errorMessage);
      }
      
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptCall = () => {
    if (connection) {
      connection.accept();
      setIsCallActive(true);
      setIsIncomingCall(false);
      startCallTimer();
    }
  };

  const handleRejectCall = () => {
    if (connection) {
      connection.reject();
      setIsIncomingCall(false);
      setConnection(null);
    }
  };

  const endCall = () => {
    if (connection) {
      connection.disconnect();
      setConnection(null);
    }
    setIsCallActive(false);
    setIsIncomingCall(false);
    setIsMuted(false);
    setIsSpeakerOn(false);
    stopCallTimer();
    toast.info(`Call ended (${formatDuration(callDuration)})`);
  };

  return {
    isLoading,
    errorDetails,
    startCall,
    handleAcceptCall,
    handleRejectCall,
    endCall,
    formatDuration
  };
};
