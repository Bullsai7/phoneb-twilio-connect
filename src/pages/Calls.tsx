
import React from 'react';
import CallInterface from '@/components/Calls/CallInterface';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from 'lucide-react';
import { useTwilio } from '@/context/TwilioContext';

const Calls = () => {
  const { isAuthenticated: isTwilioSetup } = useTwilio();
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Make a Call</h1>
      
      {isTwilioSetup && (
        <Alert variant="default" className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Ready to Call</AlertTitle>
          <AlertDescription>
            Your Twilio account is connected. Enter a phone number to make a call.
          </AlertDescription>
        </Alert>
      )}
      
      <CallInterface />
    </div>
  );
};

export default Calls;
