
import React, { useEffect } from 'react';
import { Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from 'react-router-dom';
import { useTwilio } from '@/context/TwilioContext';
import AudioPermissions from './AudioPermissions';
import DialPad from './DialPad';
import IncomingCall from './IncomingCall';
import ActiveCall from './ActiveCall';
import { CallProvider, useCallContext } from './CallContext';
import { useCallSetup } from './hooks/useCallSetup';
import { useAudioPermissions } from './hooks/useAudioPermissions';
import { usePhoneNumber } from './hooks/usePhoneNumber';
import { useCallManagement } from './hooks/useCallManagement';

const CallInterfaceContent = () => {
  const { isAuthenticated: isTwilioSetup } = useTwilio();
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
  } = useCallManagement(micPermission, isTwilioSetup);

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

  // Set up Twilio device
  useCallSetup(micPermission);

  // Check for microphone and speaker permissions on mount
  useEffect(() => {
    checkAudioPermissions();
  }, []);

  const handleStartCall = () => startCall(phoneNumber);
  const toggleMute = () => setIsMuted(!isMuted);
  const toggleSpeaker = () => setIsSpeakerOn(!isSpeakerOn);

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
          disabled={!isTwilioSetup || micPermission !== 'granted'}
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
