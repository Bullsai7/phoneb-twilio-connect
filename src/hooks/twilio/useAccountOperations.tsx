
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { TwilioAccount } from '@/components/Calls/hooks/useCallSetup';

export function useAccountOperations(refreshAccounts: () => Promise<void>) {
  const addAccount = async (accountData: Omit<TwilioAccount, 'id' | 'is_default'> & { is_default?: boolean }) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      toast.error("You must be logged in to add a Twilio account");
      return null;
    }

    try {
      const makeDefault = accountData.is_default;
      
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

      if (makeDefault) {
        await supabase
          .from('twilio_accounts')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .neq('id', data.id);
      }

      toast.success(`Added Twilio account: ${accountData.account_name}`);
      await refreshAccounts();
      return data;
    } catch (err) {
      console.error('Error adding Twilio account:', err);
      toast.error(err instanceof Error ? err.message : String(err));
      return null;
    }
  };

  const setAsDefault = async (accountId: string) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      toast.error("You must be logged in to update a Twilio account");
      return false;
    }

    try {
      await supabase
        .from('twilio_accounts')
        .update({ is_default: false })
        .eq('user_id', user.id);
      
      const { error } = await supabase
        .from('twilio_accounts')
        .update({ is_default: true })
        .eq('id', accountId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Error setting account as default: ${error.message}`);
      }

      toast.success("Default Twilio account updated");
      await refreshAccounts();
      return true;
    } catch (err) {
      console.error('Error setting account as default:', err);
      toast.error(err instanceof Error ? err.message : String(err));
      return false;
    }
  };

  const updateAccount = async (accountId: string, accountData: Partial<Omit<TwilioAccount, 'id'>>) => {
    const user = (await supabase.auth.getUser()).data.user;
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
      await refreshAccounts();
      return true;
    } catch (err) {
      console.error('Error updating Twilio account:', err);
      toast.error(err instanceof Error ? err.message : String(err));
      return false;
    }
  };

  const deleteAccount = async (accountId: string, accounts: TwilioAccount[]) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      toast.error("You must be logged in to delete a Twilio account");
      return false;
    }

    try {
      const isDefault = accounts.find(acc => acc.id === accountId)?.is_default;
      
      const { error } = await supabase
        .from('twilio_accounts')
        .delete()
        .eq('id', accountId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Error deleting Twilio account: ${error.message}`);
      }

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
      await refreshAccounts();
      return true;
    } catch (err) {
      console.error('Error deleting Twilio account:', err);
      toast.error(err instanceof Error ? err.message : String(err));
      return false;
    }
  };

  return {
    addAccount,
    updateAccount,
    deleteAccount,
    setAsDefault
  };
}
