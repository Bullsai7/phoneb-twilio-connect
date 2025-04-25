
import React from 'react';
import { Info, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ConnectionTroubleshootingProps {
  refreshingSession: boolean;
  handleRetryConnection: () => void;
  showTroubleshooting: boolean;
  setShowTroubleshooting: (show: boolean) => void;
  showWebhookGuide: boolean;
  setShowWebhookGuide: (show: boolean) => void;
}

const ConnectionTroubleshooting = ({
  refreshingSession,
  handleRetryConnection,
  showTroubleshooting,
  setShowTroubleshooting,
  showWebhookGuide,
  setShowWebhookGuide,
}: ConnectionTroubleshootingProps) => {
  return (
    <Alert variant="default" className="mb-4">
      <Info className="h-4 w-4" />
      <AlertTitle>Connection Troubleshooting</AlertTitle>
      <AlertDescription className="flex flex-col space-y-2">
        <p>If you're experiencing connection issues, try refreshing your session:</p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRetryConnection} 
            disabled={refreshingSession} 
            className="w-fit flex items-center gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${refreshingSession ? 'animate-spin' : ''}`} />
            {refreshingSession ? "Refreshing..." : "Refresh Connection"}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowTroubleshooting(!showTroubleshooting)} 
            className="w-fit"
          >
            {showTroubleshooting ? "Hide Troubleshooting" : "Show Troubleshooting Tips"}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowWebhookGuide(!showWebhookGuide)} 
            className="w-fit"
          >
            {showWebhookGuide ? "Hide Webhook Guide" : "Show Webhook Guide"}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ConnectionTroubleshooting;
