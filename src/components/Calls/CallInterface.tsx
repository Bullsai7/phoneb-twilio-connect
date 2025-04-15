
import React, { useState, useEffect, useRef } from 'react';
import { Settings, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Link } from 'react-router-dom';
import { useTwilio } from '@/context/TwilioContext';
import AudioPermissions from './AudioPermissions';
import DialPad from './DialPad';
import IncomingCall from './IncomingCall';
import ActiveCall from './ActiveCall';
import { CallProvider, useCallContext } from './CallContext';
import { useCallSetup } from './hooks/useCallSetup';

const CallInterfaceContent = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [audioOutput, setAudioOutput] = useState<'granted' | 'denied' | 'pending'>('pending');
  const { session } = useSupabaseAuth();
  const { isAuthenticated: isTwilioSetup } = useTwilio();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const {
    connection,
    setConnection,
    isCallActive,
    setIsCallActive,
    callTo,
    setCallTo,
    callDuration,
    setCallDuration,
    isIncomingCall,
    setIsIncomingCall,
    incomingCallFrom,
    setIncomingCallFrom,
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

  const checkAudioPermissions = async () => {
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
      micStream.getTracks().forEach(track => track.stop());
      
      const audio = new Audio();
      audio.volume = 0.01;
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setAudioOutput('granted');
            audio.pause();
          })
          .catch(() => {
            setAudioOutput('denied');
          });
      }
    } catch (error) {
      console.error("Error checking audio permissions:", error);
      setMicPermission('denied');
    }
  };

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
      toast.success("Microphone access granted");
    } catch (error) {
      setMicPermission('denied');
      toast.error("Microphone access denied. Please enable it in your browser settings.");
    }
  };

  const testAudioOutput = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/ringtone.mp3');
      }
      
      audioRef.current.volume = 0.3;
      audioRef.current.play()
        .then(() => {
          setAudioOutput('granted');
          toast.success("Speaker test successful");
          
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }
          }, 2000);
        })
        .catch(error => {
          setAudioOutput('denied');
          toast.error("Speaker test failed. Please check your browser settings.");
        });
    } catch (error) {
      console.error("Error testing audio output:", error);
      toast.error("Error testing audio output");
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    let formattedValue = '';
    if (numericValue.length <= 3) {
      formattedValue = numericValue;
    } else if (numericValue.length <= 6) {
      formattedValue = `(${numericValue.slice(0, 3)}) ${numericValue.slice(3)}`;
    } else {
      formattedValue = `(${numericValue.slice(0, 3)}) ${numericValue.slice(3, 6)}-${numericValue.slice(6, 10)}`;
    }
    return formattedValue;
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhoneNumber(e.target.value));
  };

  const startCall = async () => {
    setErrorDetails(null);
    
    if (micPermission !== 'granted') {
      toast.error("Microphone access is required to make calls");
      await requestMicPermission();
      return;
    }
    
    const numericValue = phoneNumber.replace(/\D/g, '');
    if (numericValue.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    if (!isTwilioSetup) {
      toast.error("Please set up your Twilio credentials in the settings first");
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('make-call', {
        body: { to: numericValue },
        headers: session?.access_token 
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined
      });
      
      if (error) throw new Error(error.message || "Failed to connect to call service");
      if (!data?.success) throw new Error(data?.error || "Failed to initiate call");
      
      setIsCallActive(true);
      setCallTo(phoneNumber);
      setCallDuration(0);
      startCallTimer();
      toast.success(`Calling ${phoneNumber}...`);
      
    } catch (error: any) {
      console.error('Error making call:', error);
      const errorMessage = error.message || "Failed to make call";
      
      if (errorMessage.includes("Twilio credentials not found")) {
        setErrorDetails("Twilio credentials are missing or invalid. Please check your settings.");
      } else if (errorMessage.includes("Invalid token")) {
        setErrorDetails("Your session has expired. Please sign in again.");
      } else {
        setErrorDetails(errorMessage);
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptCall = () => {
    if (connection) {
      connection.accept();
      setIsCallActive(true);
      setIsIncomingCall(false);
      startCallTimer();
      toast.success(`Connected with ${incomingCallFrom}`);
    }
  };

  const handleRejectCall = () => {
    if (connection) {
      connection.reject();
      setIsIncomingCall(false);
      setConnection(null);
      toast.info(`Rejected call from ${incomingCallFrom}`);
    }
  };

  const endCall = () => {
    if (connection) {
      connection.disconnect();
      setConnection(null);
    }
    setIsCallActive(false);
    setIsIncomingCall(false);
    setIsMuted(false);
    setIsSpeakerOn(false);
    stopCallTimer();
    toast.info(`Call ended (${formatDuration(callDuration)})`);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (connection) {
      connection.mute(!isMuted);
    }
    toast.info(isMuted ? "Microphone unmuted" : "Microphone muted");
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    toast.info(isSpeakerOn ? "Speaker off" : "Speaker on");
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  const startCallTimer = () => {
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    // @ts-ignore
    window.callInterval = interval;
  };

  const stopCallTimer = () => {
    // @ts-ignore
    if (window.callInterval) {
      // @ts-ignore
      clearInterval(window.callInterval);
      // @ts-ignore
      window.callInterval = null;
    }
  };

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
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Twilio Not Configured</AlertTitle>
          <AlertDescription className="flex flex-col space-y-2">
            <p>Please configure your Twilio credentials in the dashboard to make calls.</p>
            <Button variant="outline" size="sm" asChild className="w-fit">
              <Link to="/dashboard">
                <Settings className="mr-2 h-4 w-4" />
                Configure Twilio
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {errorDetails && (
        <Alert className="mb-4" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
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
          onStartCall={startCall}
          isLoading={isLoading}
          disabled={!isTwilioSetup || micPermission !== 'granted'}
          onDigitClick={(digit) => setPhoneNumber(prev => formatPhoneNumber(prev + digit))}
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
