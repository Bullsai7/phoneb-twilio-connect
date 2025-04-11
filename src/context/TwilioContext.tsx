
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";

type TwilioCredentials = {
  accountSid: string;
  authToken: string;
};

type TwilioContextType = {
  credentials: TwilioCredentials | null;
  isAuthenticated: boolean;
  login: (credentials: TwilioCredentials) => void;
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

  // Load credentials from localStorage on mount
  useEffect(() => {
    const storedCredentials = localStorage.getItem('twilio_credentials');
    if (storedCredentials) {
      try {
        const parsedCredentials = JSON.parse(storedCredentials);
        setCredentials(parsedCredentials);
      } catch (error) {
        console.error('Failed to parse stored credentials', error);
        localStorage.removeItem('twilio_credentials');
      }
    }
    setLoading(false);
  }, []);

  // Save credentials to localStorage when they change
  useEffect(() => {
    if (credentials) {
      localStorage.setItem('twilio_credentials', JSON.stringify(credentials));
    }
  }, [credentials]);

  const login = (newCredentials: TwilioCredentials) => {
    // In a real implementation, we would validate these credentials with Twilio
    // before storing them
    setCredentials(newCredentials);
    toast.success("Successfully authenticated with Twilio");
  };

  const logout = () => {
    setCredentials(null);
    localStorage.removeItem('twilio_credentials');
    toast.info("Logged out from Twilio");
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
