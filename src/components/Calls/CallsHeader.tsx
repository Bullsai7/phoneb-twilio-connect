
import React from 'react';
import { Info, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { useTwilio } from '@/context/TwilioContext';

interface CallsHeaderProps {
  showSetupGuide: boolean;
  setShowSetupGuide: (show: boolean) => void;
}

const CallsHeader = ({ showSetupGuide, setShowSetupGuide }: CallsHeaderProps) => {
  const { isAuthenticated: isTwilioSetup } = useTwilio();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Make a Call</h1>
      
      {isTwilioSetup ? (
        <Alert variant="default" className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Ready to Call</AlertTitle>
          <AlertDescription>
            Your Twilio account is connected. Enter a phone number to make a call.
            Remember to allow microphone access when prompted by your browser.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Twilio Setup Required</AlertTitle>
          <AlertDescription className="flex flex-col space-y-2">
            <p>To make calls, you need to set up your Twilio account first. Go to the dashboard and configure your Twilio credentials.</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild className="w-fit">
                <Link to="/dashboard">Configure Twilio</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowSetupGuide(!showSetupGuide)}>
                {showSetupGuide ? "Hide Setup Guide" : "Show Setup Guide"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CallsHeader;
