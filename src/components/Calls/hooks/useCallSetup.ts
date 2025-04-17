
import { useEffect } from 'react';
import { Device } from '@twilio/voice-sdk';
import { useCallContext } from '../CallContext';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { toast } from "sonner";

export const useCallSetup = (micPermission: string) => {
  const { session } = useSupabaseAuth();
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
    
    const setupTwilioDevice = async () => {
      try {
        if (!session?.access_token) {
          console.log("No access token available, skipping Twilio setup");
          return;
        }
        
        console.log("Requesting Twilio token...");
        const { data, error } = await supabase.functions.invoke('get-twilio-token', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });

        if (error) {
          console.error("Error invoking get-twilio-token function:", error);
          throw error;
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

        await newDevice.register();
        console.log('Twilio device registered successfully');
        
        hasSetupCompleted = true;
        setDevice(newDevice);
      } catch (error: any) {
        console.error('Error setting up Twilio device:', error);
        toast.error("Failed to initialize phone connection: " + error.message);
      }
    };

    if (session?.access_token) {
      setupTwilioDevice();
    }

    return () => {
      setDevice(null);
    };
  }, [session, micPermission]);
};
