
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Phone, RefreshCw, PhoneForwarded } from 'lucide-react';
import { toast } from "sonner";
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useTwilioAccounts } from '@/hooks/useTwilioAccounts';
import { PhoneNumberList } from './PhoneNumberList';
import { usePhoneNumberOperations } from '@/hooks/usePhoneNumberOperations';
import { TwilioPhoneNumber } from '@/types/twilio';

const PhoneNumberSelector = () => {
  const { session } = useSupabaseAuth();
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState("US");
  const { accounts, defaultAccount, updateAccount, refreshAccounts } = useTwilioAccounts();

  const {
    isLoadingNumbers,
    availableNumbers,
    ownedNumbers,
    fetchAvailableNumbers,
    handlePurchaseNumber
  } = usePhoneNumberOperations(selectedAccountId, session, refreshAccounts);

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
                <PhoneNumberList 
                  numbers={ownedNumbers} 
                  isLoading={isLoadingNumbers}
                  selectedAccount={accounts.find(acc => acc.id === selectedAccountId) || {}}
                  onSelect={handleSelectOwnedNumber}
                  alreadyOwned={true}
                />
              </TabsContent>
              
              <TabsContent value="available" className="mt-4">
                <PhoneNumberList 
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
