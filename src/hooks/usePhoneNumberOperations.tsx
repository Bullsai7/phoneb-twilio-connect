
import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { TwilioPhoneNumber } from '@/types/twilio';

export function usePhoneNumberOperations(selectedAccountId: string, session: any, onSuccess?: () => Promise<void>) {
  const [isLoadingNumbers, setIsLoadingNumbers] = useState(false);
  const [availableNumbers, setAvailableNumbers] = useState<TwilioPhoneNumber[]>([]);
  const [ownedNumbers, setOwnedNumbers] = useState<TwilioPhoneNumber[]>([]);

  const fetchAvailableNumbers = async (accountSid: string, authToken: string, countryCode = 'US') => {
    if (!session?.access_token) return;
    
    setIsLoadingNumbers(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-available-numbers', {
        body: { accountSid, authToken, countryCode },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) {
        console.error("Error fetching available numbers:", error);
        toast.error("Failed to fetch available phone numbers");
        return;
      }

      if (data?.availableNumbers) {
        setAvailableNumbers(data.availableNumbers);
      }
      
      if (data?.ownedNumbers) {
        setOwnedNumbers(data.ownedNumbers);
      }
    } catch (error) {
      console.error("Error fetching available numbers:", error);
      toast.error("Failed to fetch available phone numbers");
    } finally {
      setIsLoadingNumbers(false);
    }
  };

  const handlePurchaseNumber = async (number: TwilioPhoneNumber) => {
    if (!selectedAccountId || !session?.access_token) {
      toast.error("Please select a Twilio account first");
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('purchase-phone-number', {
        body: { 
          accountId: selectedAccountId,
          phoneNumber: number.phoneNumber
        },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      
      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || "Failed to purchase phone number");
      }
      
      toast.success(`Successfully purchased ${number.phoneNumber}`);
      
      if (onSuccess) {
        await onSuccess();
      }
      
    } catch (error: any) {
      console.error("Error purchasing number:", error);
      toast.error(error.message || "Failed to purchase phone number");
    }
  };

  return {
    isLoadingNumbers,
    availableNumbers,
    ownedNumbers,
    fetchAvailableNumbers,
    handlePurchaseNumber
  };
}
