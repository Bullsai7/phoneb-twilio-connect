
import React from 'react';
import MessageInterface from '@/components/Messages/MessageInterface';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { useTwilio } from '@/context/TwilioContext';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Messages = () => {
  const { isAuthenticated: isTwilioSetup } = useTwilio();
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Messages</h1>
      
      {!isTwilioSetup && (
        <Alert variant="warning" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Twilio Setup Required</AlertTitle>
          <AlertDescription className="flex flex-col space-y-2">
            <p>To send and receive messages, you need to set up your Twilio credentials in the dashboard.</p>
            <Button variant="outline" size="sm" asChild className="w-fit">
              <Link to="/dashboard">Configure Twilio</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <MessageInterface />
    </div>
  );
};

export default Messages;
