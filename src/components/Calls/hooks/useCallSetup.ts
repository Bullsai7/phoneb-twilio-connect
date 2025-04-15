
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
    const setupTwilioDevice = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-twilio-token', {
          headers: session?.access_token 
            ? { Authorization: `Bearer ${session.access_token}` }
            : undefined
        });

        if (error) throw error;

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
