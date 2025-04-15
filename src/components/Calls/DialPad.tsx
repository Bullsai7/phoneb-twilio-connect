
import React from 'react';
import { Phone } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface DialPadProps {
  phoneNumber: string;
  onPhoneNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStartCall: () => void;
  isLoading: boolean;
  disabled: boolean;
  onDigitClick: (digit: string) => void;
}

const DialPad = ({
  phoneNumber,
  onPhoneNumberChange,
  onStartCall,
  isLoading,
  disabled,
  onDigitClick
}: DialPadProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Input
              type="text"
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={onPhoneNumberChange}
              className="flex-1 phoneb-input"
            />
            <Button 
              onClick={onStartCall}
              className="rounded-full h-12 w-12 bg-phoneb-success hover:bg-phoneb-success/90 flex items-center justify-center p-0"
              disabled={disabled || isLoading}
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-t-2 border-b-2 border-white"></div>
              ) : (
                <Phone className="h-5 w-5" />
              )}
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((digit) => (
              <Button
                key={digit}
                variant="outline"
                className="h-14 text-lg"
                onClick={() => onDigitClick(digit.toString())}
              >
                {digit}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DialPad;
