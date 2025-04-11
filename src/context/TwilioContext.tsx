
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/integrations/supabase/client';

type TwilioCredentials = {
  accountSid: string;
  authToken: string;
};

type TwilioContextType = {
  credentials: TwilioCredentials | null;
  isAuthenticated: boolean;
  login: (credentials: TwilioCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const TwilioContext = createContext<TwilioContextType | undefined>(undefined);

export const useTwilio = () => {
  const context = useContext(TwilioContext);
  if (context === undefined) {
    throw new Error('useTwilio must be used within a TwilioProvider');
  }
  return context;
};

export const TwilioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [credentials, setCredentials] = useState<TwilioCredentials | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useSupabaseAuth();

  // Load credentials from Supabase when user changes
  useEffect(() => {
    const fetchTwilioCredentials = async () => {
      if (!user) {
        setCredentials(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('twilio_account_sid, twilio_auth_token')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching Twilio credentials:', error);
          setCredentials(null);
        } else if (data && data.twilio_account_sid && data.twilio_auth_token) {
          setCredentials({
            accountSid: data.twilio_account_sid,
            authToken: data.twilio_auth_token
          });
        } else {
          setCredentials(null);
        }
      } catch (error) {
        console.error('Error fetching Twilio credentials:', error);
        setCredentials(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTwilioCredentials();
  }, [user]);

  const login = async (newCredentials: TwilioCredentials) => {
    if (!user) {
      toast.error("You must be logged in to save Twilio credentials");
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real implementation, we would validate these credentials with Twilio
      // before storing them
      const { error } = await supabase
        .from('profiles')
        .update({
          twilio_account_sid: newCredentials.accountSid,
          twilio_auth_token: newCredentials.authToken
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      setCredentials(newCredentials);
      toast.success("Successfully authenticated with Twilio");
    } catch (error: any) {
      console.error('Failed to save Twilio credentials:', error);
      toast.error(error.message || "Failed to save Twilio credentials");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          twilio_account_sid: null,
          twilio_auth_token: null
        })
        .eq('id', user.id);
      
      if (error) {
        console.error('Error clearing Twilio credentials:', error);
      }
      
      setCredentials(null);
      toast.info("Logged out from Twilio");
    } catch (error) {
      console.error('Error during Twilio logout:', error);
    }
  };

  const value = {
    credentials,
    isAuthenticated: credentials !== null,
    login,
    logout,
    loading,
  };

  return <TwilioContext.Provider value={value}>{children}</TwilioContext.Provider>;
};
