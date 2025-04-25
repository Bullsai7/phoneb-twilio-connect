
import React, { useState } from 'react';
import { toast } from 'sonner';
import CallInterface from '@/components/Calls/CallInterface';
import CallsHeader from '@/components/Calls/CallsHeader';
import ConnectionTroubleshooting from '@/components/Calls/ConnectionTroubleshooting';
import WebhookGuideCard from '@/components/Calls/WebhookGuideCard';
import TroubleshootingCard from '@/components/Calls/TroubleshootingCard';
import TwiMLAppGuide from '@/components/Calls/TwiMLAppGuide';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

const Calls = () => {
  const { refreshSession, refreshingSession } = useSupabaseAuth();
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [showWebhookGuide, setShowWebhookGuide] = useState(false);
  
  const handleRetryConnection = async () => {
    try {
      await refreshSession();
      toast.success("Session refreshed. Retrying connection...");
      // Force a reload of the page after session refresh
      window.location.reload();
    } catch (error) {
      toast.error("Failed to refresh session");
    }
  };

  return (
    <div className="space-y-6">
      <CallsHeader 
        showSetupGuide={showSetupGuide}
        setShowSetupGuide={setShowSetupGuide}
      />
      
      <ConnectionTroubleshooting 
        refreshingSession={refreshingSession}
        handleRetryConnection={handleRetryConnection}
        showTroubleshooting={showTroubleshooting}
        setShowTroubleshooting={setShowTroubleshooting}
        showWebhookGuide={showWebhookGuide}
        setShowWebhookGuide={setShowWebhookGuide}
      />
      
      {showWebhookGuide && <WebhookGuideCard show={showWebhookGuide} />}
      {showTroubleshooting && <TroubleshootingCard show={showTroubleshooting} />}
      {showSetupGuide && <TwiMLAppGuide onClose={() => setShowSetupGuide(false)} />}
      
      <CallInterface />
    </div>
  );
};

export default Calls;
