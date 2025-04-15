
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

// Type guard to check if direction is valid
function isValidDirection(direction: string): direction is 'incoming' | 'outgoing' {
  return direction === 'incoming' || direction === 'outgoing';
}

// Type guard to check if status is valid
function isValidStatus(status: string): status is 'completed' | 'missed' | 'busy' | 'failed' {
  return ['completed', 'missed', 'busy', 'failed'].includes(status);
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
      console.log('Fetching history for user:', user.id);
      
      // Fetch call history
      const { data: callData, error: callError } = await supabase
        .from('call_history')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      if (callError) {
        throw new Error(`Error fetching call history: ${callError.message}`);
      }

      console.log('Call history data:', callData);

      // Fetch message history
      const { data: messageData, error: messageError } = await supabase
        .from('message_history')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      if (messageError) {
        throw new Error(`Error fetching message history: ${messageError.message}`);
      }

      console.log('Message history data:', messageData);

      // Transform and validate call data
      const validatedCallData: CallHistoryItem[] = (callData || [])
        .filter(call => {
          // Log if a record is being filtered out
          if (!isValidDirection(call.direction) || !isValidStatus(call.status)) {
            console.log('Filtering out invalid call record:', call);
            return false;
          }
          return true;
        })
        .map(call => ({
          id: call.id,
          phone_number: call.phone_number,
          contact_name: call.contact_name,
          timestamp: call.timestamp,
          direction: call.direction as 'incoming' | 'outgoing',
          duration: call.duration,
          status: call.status as 'completed' | 'missed' | 'busy' | 'failed'
        }));

      // Transform and validate message data
      const validatedMessageData: MessageHistoryItem[] = (messageData || [])
        .filter(message => {
          // Log if a record is being filtered out
          if (!isValidDirection(message.direction)) {
            console.log('Filtering out invalid message record:', message);
            return false;
          }
          return true;
        })
        .map(message => ({
          id: message.id,
          phone_number: message.phone_number,
          contact_name: message.contact_name,
          timestamp: message.timestamp,
          direction: message.direction as 'incoming' | 'outgoing',
          content: message.content
        }));

      console.log('Validated call history:', validatedCallData.length, 'items');
      console.log('Validated message history:', validatedMessageData.length, 'items');

      setCallHistory(validatedCallData);
      setMessageHistory(validatedMessageData);
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
