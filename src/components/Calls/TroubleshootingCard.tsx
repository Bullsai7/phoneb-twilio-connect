
import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface TroubleshootingCardProps {
  show: boolean;
}

const TroubleshootingCard = ({ show }: TroubleshootingCardProps) => {
  if (!show) return null;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Troubleshooting Phone Connection</CardTitle>
        <CardDescription>Common issues and how to fix them</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium mb-1">Edge Function Errors</h3>
          <p className="text-sm text-muted-foreground mb-2">
            If you see "Edge Function returned a non-2xx status code", this typically means there's an issue with your Twilio configuration.
          </p>
          <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground ml-4">
            <li>Verify that your Twilio Account SID and Auth Token are correct in the Dashboard</li>
            <li>Make sure your TwiML App SID is added in Dashboard settings</li>
            <li>Check that you have a valid Twilio phone number</li>
            <li>Try refreshing your session using the button above</li>
            <li>If problems persist, try logging out and back in</li>
          </ol>
        </div>
        
        <div>
          <h3 className="font-medium mb-1">Microphone Issues</h3>
          <p className="text-sm text-muted-foreground mb-2">
            If your microphone isn't working:
          </p>
          <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground ml-4">
            <li>Make sure your browser has permission to access your microphone</li>
            <li>Check your device settings to ensure the correct microphone is selected</li>
            <li>Try using a different browser if problems persist</li>
          </ol>
        </div>
        
        <div>
          <h3 className="font-medium mb-1">Account Verification</h3>
          <p className="text-sm text-muted-foreground mb-2">
            If you're using a Twilio trial account:
          </p>
          <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground ml-4">
            <li>Verify your personal phone number in the Twilio Console</li>
            <li>You can only call verified numbers with a trial account</li>
            <li>Consider upgrading to a full Twilio account for production use</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default TroubleshootingCard;
