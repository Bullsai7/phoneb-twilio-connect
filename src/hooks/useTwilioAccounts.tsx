
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { toast } from "sonner";
import { TwilioAccount } from '@/components/Calls/hooks/useCallSetup';

export function useTwilioAccounts() {
  const [accounts, setAccounts] = useState<TwilioAccount[]>([]);
  const [defaultAccount, setDefaultAccount] = useState<TwilioAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useSupabaseAuth();

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
      
      // Find the default account
      const defaultAcc = data?.find(acc => acc.is_default);
      if (defaultAcc) {
        setDefaultAccount(defaultAcc);
      } else if (data && data.length > 0) {
        // If no default is set but accounts exist, use the first one
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

  const addAccount = async (accountData: Omit<TwilioAccount, 'id' | 'is_default'> & { is_default?: boolean }) => {
    if (!user) {
      toast.error("You must be logged in to add a Twilio account");
      return null;
    }

    try {
      // If this is the first account or explicitly set as default
      const makeDefault = accounts.length === 0 || accountData.is_default;
      
      const { data, error } = await supabase
        .from('twilio_accounts')
        .insert({
          user_id: user.id,
          account_name: accountData.account_name,
          account_sid: accountData.account_sid,
          auth_token: accountData.auth_token,
          app_sid: accountData.app_sid,
          phone_number: accountData.phone_number,
          is_default: makeDefault
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Error adding Twilio account: ${error.message}`);
      }

      // If setting as default, update all other accounts
      if (makeDefault) {
        await supabase
          .from('twilio_accounts')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .neq('id', data.id);
      }

      toast.success(`Added Twilio account: ${accountData.account_name}`);
      await fetchAccounts();
      return data;
    } catch (err) {
      console.error('Error adding Twilio account:', err);
      toast.error(err instanceof Error ? err.message : String(err));
      return null;
    }
  };

  const setAsDefault = async (accountId: string) => {
    if (!user) {
      toast.error("You must be logged in to update a Twilio account");
      return false;
    }

    try {
      // First set all accounts to non-default
      await supabase
        .from('twilio_accounts')
        .update({ is_default: false })
        .eq('user_id', user.id);
      
      // Then set the specified account as default
      const { error } = await supabase
        .from('twilio_accounts')
        .update({ is_default: true })
        .eq('id', accountId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Error setting account as default: ${error.message}`);
      }

      toast.success("Default Twilio account updated");
      await fetchAccounts();
      return true;
    } catch (err) {
      console.error('Error setting account as default:', err);
      toast.error(err instanceof Error ? err.message : String(err));
      return false;
    }
  };

  const updateAccount = async (accountId: string, accountData: Partial<Omit<TwilioAccount, 'id'>>) => {
    if (!user) {
      toast.error("You must be logged in to update a Twilio account");
      return false;
    }

    try {
      const { error } = await supabase
        .from('twilio_accounts')
        .update(accountData)
        .eq('id', accountId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Error updating Twilio account: ${error.message}`);
      }

      toast.success("Twilio account updated");
      await fetchAccounts();
      return true;
    } catch (err) {
      console.error('Error updating Twilio account:', err);
      toast.error(err instanceof Error ? err.message : String(err));
      return false;
    }
  };

  const deleteAccount = async (accountId: string) => {
    if (!user) {
      toast.error("You must be logged in to delete a Twilio account");
      return false;
    }

    try {
      // Check if this is the default account and if there are other accounts
      const isDefault = accounts.find(acc => acc.id === accountId)?.is_default;
      
      const { error } = await supabase
        .from('twilio_accounts')
        .delete()
        .eq('id', accountId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Error deleting Twilio account: ${error.message}`);
      }

      // If we deleted the default account and there are other accounts, set a new default
      if (isDefault && accounts.length > 1) {
        const nextAccount = accounts.find(acc => acc.id !== accountId);
        if (nextAccount) {
          await supabase
            .from('twilio_accounts')
            .update({ is_default: true })
            .eq('id', nextAccount.id)
            .eq('user_id', user.id);
        }
      }

      toast.success("Twilio account deleted");
      await fetchAccounts();
      return true;
    } catch (err) {
      console.error('Error deleting Twilio account:', err);
      toast.error(err instanceof Error ? err.message : String(err));
      return false;
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
    refreshAccounts: fetchAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
    setAsDefault
  };
}
