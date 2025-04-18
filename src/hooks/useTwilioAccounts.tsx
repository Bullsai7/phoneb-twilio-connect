
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useFetchAccounts } from './twilio/useFetchAccounts';
import { useAccountOperations } from './twilio/useAccountOperations';

export function useTwilioAccounts() {
  const { user } = useSupabaseAuth();
  const { 
    accounts, 
    defaultAccount, 
    loading, 
    error, 
    refreshAccounts 
  } = useFetchAccounts(user);

  const {
    addAccount,
    updateAccount,
    deleteAccount,
    setAsDefault
  } = useAccountOperations(refreshAccounts);

  return {
    accounts,
    defaultAccount,
    loading,
    error,
    refreshAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
    setAsDefault
  };
}
