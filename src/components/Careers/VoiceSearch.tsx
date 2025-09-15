import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VoiceSearchProps {
  onTranscription: (text: string, isFinal?: boolean) => void;
  disabled?: boolean;
}

const VoiceSearch: React.FC<VoiceSearchProps> = ({ onTranscription, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      // Helper: fallback to MediaRecorder + Edge Function
      const startMediaRecorder = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        audioChunksRef.current = [];
        mediaRecorderRef.current = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = async () => {
          // Since we're now using browser-based transcription only,
          // we don't need to process audio on the server
          stream.getTracks().forEach(track => track.stop());
          setIsProcessing(false);
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);

        toast({
          title: "Recording Started",
          description: "Speak your job search query...",
        });
      };

      // Prefer on-device Web Speech API for live partial captions
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        let finalTranscript = '';
        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript as string;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
              onTranscription(finalTranscript.trim(), true);
            } else {
              interim += transcript;
            }
          }
          const live = (finalTranscript + ' ' + interim).trim();
          if (live) onTranscription(live, false);
        };

        recognition.onstart = () => {
          setIsRecording(true);
          setIsProcessing(false);
          toast({ title: 'Listening...', description: 'Speak your job search query...' });
        };

        recognition.onerror = (_e: any) => {
          // Fall back to server-side transcription if speech API fails
          recognitionRef.current = null;
          startMediaRecorder();
        };

        recognition.onend = () => {
          setIsRecording(false);
          setIsProcessing(false);
        };

        recognition.start();
        return;
      }

      // Fallback when Web Speech API is not available
      await startMediaRecorder();

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      try { recognitionRef.current.stop(); } catch {}
      setIsRecording(false);
      return;
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 0x8000; // 32KB chunks

      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }

      const base64Audio = btoa(binary);

      // Send to Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio }
      });

      if (error) throw error;

      const transcription = data?.text?.trim();
      if (transcription) {
        onTranscription(transcription, true);
        toast({
          title: "Voice Search Complete",
          description: `Searching for: "${transcription}"`,
        });
      } else {
        toast({
          title: "No Speech Detected",
          description: "Please try speaking more clearly.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process voice input. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Button
      type="button"
      variant={isRecording ? "destructive" : "outline"}
      size="icon"
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className={`relative ${isRecording ? 'animate-pulse' : ''}`}
      title={isRecording ? "Stop recording" : "Start voice search"}
    >
      {isProcessing ? (
        <Volume2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
      
      {isRecording && (
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />
      )}
    </Button>
  );
};

export default VoiceSearch;