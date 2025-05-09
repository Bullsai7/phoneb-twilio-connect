
import { useEffect, useState, useCallback } from 'react';
import { Device } from '@twilio/voice-sdk';
import { useCallContext } from '../CallContext';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { toast } from "sonner";

export interface TwilioAccount {
  id: string;
  account_name: string;
  account_sid: string;
  auth_token: string;
  app_sid: string | null;
  phone_number: string | null;
  is_default: boolean;
}

export interface TwilioPhoneNumber {
  phoneNumber: string;
  friendlyName: string;
  sid?: string;
  capabilities?: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
  available: boolean;
  locality?: string;
  region?: string;
  isoCountry?: string;
  dateCreated?: string;
}

export const useCallSetup = (micPermission: string, selectedAccountId?: string) => {
  const { session, refreshSession } = useSupabaseAuth();
  const [isInitializing, setIsInitializing] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [availableNumbers, setAvailableNumbers] = useState<TwilioPhoneNumber[]>([]);
  const [ownedNumbers, setOwnedNumbers] = useState<TwilioPhoneNumber[]>([]);
  const [isLoadingNumbers, setIsLoadingNumbers] = useState(false);
  const [tokenRetries, setTokenRetries] = useState(0);
  const [needsSetup, setNeedsSetup] = useState(false);
  const {
    setDevice,
    setConnection,
    setIsCallActive,
    setCallTo,
    setIsIncomingCall,
    setIncomingCallFrom,
  } = useCallContext();

  const fetchAvailableNumbers = async (accountSid: string, authToken: string, countryCode = 'US') => {
    if (!session?.access_token) return;
    
    setIsLoadingNumbers(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-available-numbers', {
        body: { accountSid, authToken, countryCode },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) {
        console.error("Error fetching available numbers:", error);
        toast.error("Failed to fetch available phone numbers");
        return;
      }

      if (data?.availableNumbers) {
        setAvailableNumbers(data.availableNumbers);
      }
      
      if (data?.ownedNumbers) {
        setOwnedNumbers(data.ownedNumbers);
      }
    } catch (error) {
      console.error("Error fetching available numbers:", error);
      toast.error("Failed to fetch available phone numbers");
    } finally {
      setIsLoadingNumbers(false);
    }
  };

  const setupTwilioDevice = useCallback(async () => {
    // Don't try to set up if we're already in the process
    if (isInitializing || !session?.access_token) {
      return;
    }
    
    try {
      setIsInitializing(true);
      setSetupError(null);
      setNeedsSetup(false);
      
      console.log("Requesting Twilio token...");
      
      // Pass the selected account ID if available
      const requestBody = selectedAccountId ? { accountId: selectedAccountId } : {};
      
      const { data, error } = await supabase.functions.invoke('get-twilio-token', {
        body: requestBody,
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) {
        console.error("Error invoking get-twilio-token function:", error);
        
        // If we got an auth error and have retries left, try refreshing the session
        if (error.message?.includes('auth') && tokenRetries < 3) {
          setTokenRetries(prev => prev + 1);
          const refreshSuccessful = await refreshSession();
          if (refreshSuccessful) {
            setIsInitializing(false);
            return; // This will trigger the effect again with refreshed token
          } else {
            throw new Error("Failed to refresh authentication. Please try logging out and back in.");
          }
        }
        
        throw new Error(error.message || "Failed to get token from server");
      }

      if (!data?.token) {
        if (data?.needsSetup) {
          setNeedsSetup(true);
        }
        
        if (data?.error) {
          throw new Error(data.error);
        }
        
        console.error("No token returned from get-twilio-token function");
        throw new Error("Failed to get Twilio token");
      }

      console.log("Token received, setting up Twilio device");
      const newDevice = new Device(data.token, {
        logLevel: 1,
        codecPreferences: ['opus', 'pcmu'] as any
      });

      newDevice.on('incoming', (conn) => {
        console.log('Incoming call received');
        setIsIncomingCall(true);
        const from = conn.customParameters.get('From') || 'Unknown';
        setIncomingCallFrom(from);
        setConnection(conn);
        
        if (micPermission === 'granted') {
          conn.accept();
          setIsCallActive(true);
          setCallTo(from);
        } else {
          toast.error("Microphone access required to accept calls");
        }
      });

      newDevice.on('error', (error) => {
        console.error('Twilio device error:', error);
        toast.error("Error with phone connection: " + error.message);
      });

      // Register the device
      await newDevice.register();
      console.log('Twilio device registered successfully');
      
      setDevice(newDevice);
      setTokenRetries(0); // Reset retries on success
    } catch (error: any) {
      console.error('Error setting up Twilio device:', error);
      setSetupError(error.message);
      
      let errorMessage = error.message || "An unknown error occurred";
      
      if (errorMessage.includes("Application SID") || errorMessage.includes("TwiML")) {
        toast.error("TwiML App not configured properly. Please check your Twilio settings.");
      } else if (errorMessage.includes("credentials") || errorMessage.includes("auth")) {
        toast.error("Twilio credentials are missing or invalid. Please update them in settings.");
      } else if (errorMessage.includes("token")) {
        toast.error("Authentication error. Please try logging out and back in.");
      } else {
        toast.error("Failed to initialize phone connection: " + errorMessage);
      }
      
      // Set device to null in case of error
      setDevice(null);
    } finally {
      setIsInitializing(false);
    }
  }, [session, micPermission, selectedAccountId, tokenRetries, refreshSession, setDevice, setConnection, setIsCallActive, setCallTo, setIsIncomingCall, setIncomingCallFrom]);

  useEffect(() => {
    let hasSetupCompleted = false;
    let deviceInstance: Device | null = null;
    
    if (session?.access_token && !hasSetupCompleted) {
      setupTwilioDevice().then(() => {
        hasSetupCompleted = true;
      });
    }

    return () => {
      // Clean up device on unmount
      if (deviceInstance) {
        deviceInstance.destroy();
      }
      setDevice(null);
    };
  }, [session, setupTwilioDevice, setDevice]);

  return {
    isInitializing,
    setupError,
    availableNumbers,
    ownedNumbers,
    isLoadingNumbers,
    needsSetup,
    fetchAvailableNumbers,
    retrySetup: setupTwilioDevice
  };
};
