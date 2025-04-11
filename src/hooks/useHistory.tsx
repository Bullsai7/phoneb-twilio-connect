
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export interface CallHistoryItem {
  id: string;
  phone_number: string;
  contact_name: string | null;
  timestamp: string;
  direction: 'incoming' | 'outgoing';
  duration: string | null;
  status: 'completed' | 'missed' | 'busy' | 'failed';
}

export interface MessageHistoryItem {
  id: string;
  phone_number: string;
  contact_name: string | null;
  timestamp: string;
  direction: 'incoming' | 'outgoing';
  content: string;
}

interface UseHistoryReturn {
  callHistory: CallHistoryItem[];
  messageHistory: MessageHistoryItem[];
  loading: boolean;
  error: Error | null;
  refreshHistory: () => void;
}

export function useHistory(): UseHistoryReturn {
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([]);
  const [messageHistory, setMessageHistory] = useState<MessageHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useSupabaseAuth();

  const fetchHistory = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch call history
      const { data: callData, error: callError } = await supabase
        .from('call_history')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      if (callError) {
        throw new Error(`Error fetching call history: ${callError.message}`);
      }

      // Fetch message history
      const { data: messageData, error: messageError } = await supabase
        .from('message_history')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      if (messageError) {
        throw new Error(`Error fetching message history: ${messageError.message}`);
      }

      setCallHistory(callData || []);
      setMessageHistory(messageData || []);
    } catch (err) {
      console.error('Error in useHistory hook:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  return {
    callHistory,
    messageHistory,
    loading,
    error,
    refreshHistory: fetchHistory,
  };
}
