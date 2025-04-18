
import React, { useEffect, useState } from 'react';
import { Settings, PhoneForwarded } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from 'react-router-dom';
import { useTwilio } from '@/context/TwilioContext';
import AudioPermissions from './AudioPermissions';
import DialPad from './DialPad';
import IncomingCall from './IncomingCall';
import ActiveCall from './ActiveCall';
import TwiMLAppGuide from './TwiMLAppGuide';
import { CallProvider, useCallContext } from './CallContext';
import { useCallSetup, TwilioAccount } from './hooks/useCallSetup';
import { useAudioPermissions } from './hooks/useAudioPermissions';
import { usePhoneNumber } from './hooks/usePhoneNumber';
import { useCallManagement } from './hooks/useCallManagement';
import { useTwilioAccounts } from '@/hooks/useTwilioAccounts';

const CallInterfaceContent = () => {
  const { isAuthenticated: isTwilioSetup } = useTwilio();
  const { accounts, defaultAccount } = useTwilioAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showTwiMLGuide, setShowTwiMLGuide] = useState(false);
  
  const {
    micPermission,
    audioOutput,
    checkAudioPermissions,
    requestMicPermission,
    testAudioOutput
  } = useAudioPermissions();

  const {
    phoneNumber,
    handlePhoneNumberChange,
    handleDigitClick
  } = usePhoneNumber();

  const {
    isLoading,
    errorDetails,
    startCall,
    handleAcceptCall,
    handleRejectCall,
    endCall,
    formatDuration
  } = useCallManagement(micPermission, isTwilioSetup, selectedAccountId);

  const {
    isCallActive,
    callTo,
    callDuration,
    isIncomingCall,
    incomingCallFrom,
    isMuted,
    setIsMuted,
    isSpeakerOn,
    setIsSpeakerOn,
  } = useCallContext();

  // Set selected account to default on initial load
  useEffect(() => {
    if (defaultAccount && !selectedAccountId) {
      setSelectedAccountId(defaultAccount.id);
    }
  }, [defaultAccount]);

  // Check for TwiML App error in errorDetails and show guide if needed
  useEffect(() => {
    if (errorDetails && (
      errorDetails.includes('TwiML Application SID') || 
      errorDetails.includes('App SID')
    )) {
      setShowTwiMLGuide(true);
    }
  }, [errorDetails]);

  // Set up Twilio device
  const { setupError } = useCallSetup(micPermission, selectedAccountId);

  // Show TwiML guide if there's a setup error related to TwiML App
  useEffect(() => {
    if (setupError && (
      setupError.includes('TwiML Application SID') || 
      setupError.includes('App SID')
    )) {
      setShowTwiMLGuide(true);
    }
  }, [setupError]);

  // Check for microphone and speaker permissions on mount
  useEffect(() => {
    checkAudioPermissions();
  }, []);

  const handleStartCall = () => startCall(phoneNumber);
  const toggleMute = () => setIsMuted(!isMuted);
  const toggleSpeaker = () => setIsSpeakerOn(!isSpeakerOn);

  // Finding the currently selected account
  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  return (
    <div className="max-w-md mx-auto">
      <AudioPermissions
        micPermission={micPermission}
        audioOutput={audioOutput}
        onRequestMic={requestMicPermission}
        onTestAudio={testAudioOutput}
      />

      {!isTwilioSetup && (
        <Alert className="mb-4" variant="destructive">
          <Settings className="h-4 w-4" />
          <AlertTitle>Twilio Not Configured</AlertTitle>
          <AlertDescription className="flex flex-col space-y-2">
            <p>Please configure your Twilio credentials in the dashboard to make calls.</p>
            <Button variant="outline" size="sm" asChild className="w-fit">
              <Link to="/dashboard">Configure Twilio</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {showTwiMLGuide && (
        <TwiMLAppGuide onClose={() => setShowTwiMLGuide(false)} />
      )}

      {accounts.length > 0 && (
        <div className="mb-4">
          <Select 
            value={selectedAccountId || ''} 
            onValueChange={(value) => setSelectedAccountId(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Twilio account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map(account => (
                <SelectItem key={account.id} value={account.id}>
                  {account.account_name}
                  {account.is_default ? " (Default)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedAccount?.phone_number && (
            <div className="mt-2 text-sm text-muted-foreground flex items-center">
              <PhoneForwarded className="h-3 w-3 mr-1" />
              Calling from: {selectedAccount.phone_number}
            </div>
          )}
        </div>
      )}

      {errorDetails && (
        <Alert className="mb-4" variant="destructive">
          <AlertTitle>Call Error</AlertTitle>
          <AlertDescription>{errorDetails}</AlertDescription>
        </Alert>
      )}

      {isIncomingCall && !isCallActive && (
        <IncomingCall
          from={incomingCallFrom}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      {!isCallActive ? (
        <DialPad
          phoneNumber={phoneNumber}
          onPhoneNumberChange={handlePhoneNumberChange}
          onStartCall={handleStartCall}
          isLoading={isLoading}
          disabled={!isTwilioSetup || micPermission !== 'granted' || !selectedAccountId}
          onDigitClick={handleDigitClick}
        />
      ) : (
        <ActiveCall
          callTo={callTo}
          duration={formatDuration(callDuration)}
          isMuted={isMuted}
          isSpeakerOn={isSpeakerOn}
          onToggleMute={toggleMute}
          onToggleSpeaker={toggleSpeaker}
          onEndCall={endCall}
        />
      )}
    </div>
  );
};

const CallInterface = () => {
  return (
    <CallProvider>
      <CallInterfaceContent />
    </CallProvider>
  );
};

export default CallInterface;
