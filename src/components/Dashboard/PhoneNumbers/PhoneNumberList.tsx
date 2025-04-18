
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PulseLoader } from "@/components/ui/pulse-loader";
import { Check, Plus } from 'lucide-react';
import { TwilioPhoneNumber } from '@/types/twilio';

interface PhoneNumberListProps {
  numbers: TwilioPhoneNumber[];
  isLoading: boolean;
  selectedAccount: any;
  onSelect: (number: TwilioPhoneNumber) => void;
  alreadyOwned?: boolean;
}

export const PhoneNumberList = ({
  numbers,
  isLoading,
  selectedAccount,
  onSelect,
  alreadyOwned = false
}: PhoneNumberListProps) => {
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
