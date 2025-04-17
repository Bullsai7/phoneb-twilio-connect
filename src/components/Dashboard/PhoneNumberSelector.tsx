
import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PulseLoader } from "@/components/ui/pulse-loader";
import { useCallSetup, TwilioPhoneNumber } from '@/components/Calls/hooks/useCallSetup';
import { useTwilioAccounts } from '@/hooks/useTwilioAccounts';
import { Phone, Plus, Check, RefreshCw, X } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/integrations/supabase/client';

const PhoneNumbersList = ({ 
  numbers, 
  isLoading,
  selectedAccount,
  onSelect,
  alreadyOwned = false
}: { 
  numbers: TwilioPhoneNumber[], 
  isLoading: boolean,
  selectedAccount: any,
  onSelect: (number: TwilioPhoneNumber) => void,
  alreadyOwned?: boolean
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <PulseLoader />
        <span className="ml-2">Loading phone numbers...</span>
      </div>
    );
  }

  if (numbers.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed rounded-md">
        <p className="text-muted-foreground">
          {alreadyOwned 
            ? "You don't own any phone numbers in this account yet." 
            : "No available numbers found. Try changing your search criteria."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {numbers.map((number) => (
        <div 
          key={number.phoneNumber} 
          className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/50 transition-colors"
        >
          <div className="flex-1">
            <div className="font-medium">{number.phoneNumber}</div>
            <div className="text-sm text-muted-foreground">
              {number.friendlyName || `${number.region || ''} ${number.locality || ''}`}
            </div>
            {number.capabilities && (
              <div className="flex gap-1 mt-1">
                {number.capabilities.voice && <Badge variant="outline" className="text-xs">Voice</Badge>}
                {number.capabilities.sms && <Badge variant="outline" className="text-xs">SMS</Badge>}
                {number.capabilities.mms && <Badge variant="outline" className="text-xs">MMS</Badge>}
              </div>
            )}
          </div>
          
          {alreadyOwned ? (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onSelect(number)}
              disabled={selectedAccount.phone_number === number.phoneNumber}
            >
              {selectedAccount.phone_number === number.phoneNumber ? (
                <>
                  <Check className="mr-1 h-4 w-4" /> Selected
                </>
              ) : (
                "Select"
              )}
            </Button>
          ) : (
            <Button 
              size="sm"
              onClick={() => onSelect(number)}
            >
              <Plus className="mr-1 h-4 w-4" /> Purchase
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

const PhoneNumberSelector = () => {
  const { session } = useSupabaseAuth();
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [purchaseInProgress, setPurchaseInProgress] = useState(false);
  const { fetchAvailableNumbers, availableNumbers, ownedNumbers, isLoadingNumbers } = useCallSetup("granted", selectedAccountId);
  const { accounts, defaultAccount, updateAccount, refreshAccounts } = useTwilioAccounts();
  
  useEffect(() => {
    if (defaultAccount && !selectedAccountId) {
      setSelectedAccountId(defaultAccount.id);
    }
  }, [defaultAccount]);
  
  const handleFetchNumbers = async () => {
    if (!selectedAccountId) {
      toast.error("Please select a Twilio account first");
      return;
    }
    
    const account = accounts.find(acc => acc.id === selectedAccountId);
    if (!account) {
      toast.error("Selected account not found");
      return;
    }
    
    await fetchAvailableNumbers(account.account_sid, account.auth_token, selectedCountry);
  };
  
  const handlePurchaseNumber = async (number: TwilioPhoneNumber) => {
    if (!selectedAccountId || !session?.access_token) {
      toast.error("Please select a Twilio account first");
      return;
    }
    
    setPurchaseInProgress(true);
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
      
      // Update the Twilio account with the new phone number
      const account = accounts.find(acc => acc.id === selectedAccountId);
      if (account) {
        await updateAccount(account.id, { phone_number: number.phoneNumber });
      }
      
      // Refresh accounts and numbers
      await refreshAccounts();
      await handleFetchNumbers();
      
    } catch (error: any) {
      console.error("Error purchasing number:", error);
      toast.error(error.message || "Failed to purchase phone number");
    } finally {
      setPurchaseInProgress(false);
    }
  };
  
  const handleSelectOwnedNumber = async (number: TwilioPhoneNumber) => {
    if (!selectedAccountId) {
      toast.error("Please select a Twilio account first");
      return;
    }
    
    try {
      const account = accounts.find(acc => acc.id === selectedAccountId);
      if (account) {
        await updateAccount(account.id, { phone_number: number.phoneNumber });
        toast.success(`${number.phoneNumber} set as the active number for ${account.account_name}`);
        await refreshAccounts();
      }
    } catch (error: any) {
      console.error("Error selecting number:", error);
      toast.error(error.message || "Failed to select phone number");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Phone Numbers</CardTitle>
        <CardDescription>
          View, purchase, and manage your Twilio phone numbers
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Select Twilio Account</label>
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name} {account.is_default && "(Default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Country</label>
              <Select
                value={selectedCountry}
                onValueChange={setSelectedCountry}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {selectedAccountId && (
            <Button onClick={handleFetchNumbers} className="w-full">
              <Phone className="mr-2 h-4 w-4" />
              Find Available Numbers
            </Button>
          )}
          
          {(availableNumbers.length > 0 || ownedNumbers.length > 0 || isLoadingNumbers) && (
            <Tabs defaultValue="owned" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="owned">My Numbers</TabsTrigger>
                <TabsTrigger value="available">Available Numbers</TabsTrigger>
              </TabsList>
              
              <TabsContent value="owned" className="mt-4">
                <PhoneNumbersList 
                  numbers={ownedNumbers} 
                  isLoading={isLoadingNumbers}
                  selectedAccount={accounts.find(acc => acc.id === selectedAccountId) || {}}
                  onSelect={handleSelectOwnedNumber}
                  alreadyOwned={true}
                />
              </TabsContent>
              
              <TabsContent value="available" className="mt-4">
                <PhoneNumbersList 
                  numbers={availableNumbers} 
                  isLoading={isLoadingNumbers}
                  selectedAccount={accounts.find(acc => acc.id === selectedAccountId) || {}}
                  onSelect={handlePurchaseNumber}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </CardContent>
      
      {selectedAccountId && accounts.find(acc => acc.id === selectedAccountId)?.phone_number && (
        <CardFooter className="border-t pt-4 flex justify-between">
          <div>
            <span className="text-sm font-medium">Current Phone Number:</span>
            <div className="text-sm text-muted-foreground">
              {accounts.find(acc => acc.id === selectedAccountId)?.phone_number}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleFetchNumbers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default PhoneNumberSelector;
