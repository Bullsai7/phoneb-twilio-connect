
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TwilioAccount } from '@/components/Calls/hooks/useCallSetup';

export function useFetchAccounts(user: any) {
  const [accounts, setAccounts] = useState<TwilioAccount[]>([]);
  const [defaultAccount, setDefaultAccount] = useState<TwilioAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAccounts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('twilio_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Error fetching Twilio accounts: ${error.message}`);
      }

      setAccounts(data || []);
      
      const defaultAcc = data?.find(acc => acc.is_default);
      if (defaultAcc) {
        setDefaultAccount(defaultAcc);
      } else if (data && data.length > 0) {
        setDefaultAccount(data[0]);
      } else {
        setDefaultAccount(null);
      }
    } catch (err) {
      console.error('Error in useTwilioAccounts hook:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  return {
    accounts,
    defaultAccount,
    loading,
    error,
    refreshAccounts: fetchAccounts
  };
}
