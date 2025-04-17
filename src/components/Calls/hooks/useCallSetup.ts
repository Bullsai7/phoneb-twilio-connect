
import { useEffect, useState } from 'react';
import { Device } from '@twilio/voice-sdk';
import { useCallContext } from '../CallContext';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { toast } from "sonner";

export const useCallSetup = (micPermission: string) => {
  const { session } = useSupabaseAuth();
  const [isInitializing, setIsInitializing] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const {
    setDevice,
    setConnection,
    setIsCallActive,
    setCallTo,
    setIsIncomingCall,
    setIncomingCallFrom,
  } = useCallContext();

  useEffect(() => {
    let hasSetupCompleted = false;
    let deviceInstance: Device | null = null;
    
    const setupTwilioDevice = async () => {
      // Don't try to set up if we're already in the process or have completed
      if (isInitializing || hasSetupCompleted || !session?.access_token) {
        return;
      }
      
      try {
        setIsInitializing(true);
        setSetupError(null);
        
        console.log("Requesting Twilio token...");
        const { data, error } = await supabase.functions.invoke('get-twilio-token', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });

        if (error) {
          console.error("Error invoking get-twilio-token function:", error);
          throw new Error(error.message || "Failed to get token from server");
        }

        if (!data?.token) {
          console.error("No token returned from get-twilio-token function");
          throw new Error("Failed to get Twilio token");
        }

        console.log("Token received, setting up Twilio device");
        const newDevice = new Device(data.token, {
          logLevel: 1,
          codecPreferences: ['opus', 'pcmu'] as any
        });

        deviceInstance = newDevice;

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
        
        hasSetupCompleted = true;
        setDevice(newDevice);
      } catch (error: any) {
        console.error('Error setting up Twilio device:', error);
        setSetupError(error.message);
        
        if (error.message.includes("Application SID")) {
          toast.error("TwiML App not configured properly. Please check your Twilio settings.");
        } else if (error.message.includes("credentials")) {
          toast.error("Twilio credentials are missing or invalid. Please update them in settings.");
        } else {
          toast.error("Failed to initialize phone connection: " + error.message);
        }
        
        // Set device to null in case of error
        setDevice(null);
      } finally {
        setIsInitializing(false);
      }
    };

    if (session?.access_token) {
      setupTwilioDevice();
    }

    return () => {
      // Clean up device on unmount
      if (deviceInstance) {
        deviceInstance.destroy();
      }
      setDevice(null);
    };
  }, [session, micPermission]);

  return {
    isInitializing,
    setupError
  };
};
