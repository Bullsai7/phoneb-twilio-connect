
import { useState } from 'react';
import { toast } from "sonner";

export type PermissionStatus = 'granted' | 'denied' | 'pending';

export const useAudioPermissions = () => {
  const [micPermission, setMicPermission] = useState<PermissionStatus>('pending');
  const [audioOutput, setAudioOutput] = useState<PermissionStatus>('pending');
  const audioRef = useState<HTMLAudioElement | null>(null);

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
      if (!audioRef[0]) {
        audioRef[0] = new Audio('/ringtone.mp3');
      }
      
      audioRef[0].volume = 0.3;
      audioRef[0].play()
        .then(() => {
          setAudioOutput('granted');
          toast.success("Speaker test successful");
          
          setTimeout(() => {
            if (audioRef[0]) {
              audioRef[0].pause();
              audioRef[0].currentTime = 0;
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

  return {
    micPermission,
    audioOutput,
    checkAudioPermissions,
    requestMicPermission,
    testAudioOutput
  };
};
