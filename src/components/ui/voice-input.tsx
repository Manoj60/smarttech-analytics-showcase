import React, { useState, useRef, useCallback } from 'react';
import { Button } from './button';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Extend the Window interface to include speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscription,
  disabled = false,
  className = ''
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    if (disabled) return;

    try {
      setIsRecording(true);
      
      // Try Web Speech API first (for real-time transcription)
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
          console.log('Speech recognition started');
        };
        
        recognition.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          if (finalTranscript) {
            onTranscription(finalTranscript);
          }
        };
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          
          // Fallback to MediaRecorder if speech recognition fails
          startMediaRecording();
        };
        
        recognition.onend = () => {
          setIsRecording(false);
        };
        
        recognitionRef.current = recognition;
        recognition.start();
      } else {
        // Fallback to MediaRecorder
        startMediaRecording();
      }
    } catch (error) {
      console.error('Error starting voice recording:', error);
      setIsRecording(false);
      toast({
        title: "Recording Error",
        description: "Failed to start voice recording. Please check your microphone permissions.",
        variant: "destructive",
      });
    }
  }, [disabled, onTranscription, toast]);

  const startMediaRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        try {
          await processAudio(audioBlob);
        } catch (error) {
          console.error('Error processing audio:', error);
          toast({
            title: "Processing Error",
            description: "Failed to process audio. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
          stream.getTracks().forEach(track => track.stop());
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsRecording(false);
      toast({
        title: "Microphone Access",
        description: "Please allow microphone access to use voice input.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
  }, []);

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onload = async () => {
        const base64Audio = reader.result as string;
        const audioData = base64Audio.split(',')[1];
        
        // Send to voice-to-text edge function
        const response = await fetch(`https://hpntlozvucbsclhfjpko.supabase.co/functions/v1/voice-to-text`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ audio: audioData }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to transcribe audio');
        }
        
        const data = await response.json();
        if (data.text) {
          onTranscription(data.text);
          toast({
            title: "Voice Transcribed",
            description: "Your voice message has been converted to text.",
          });
        }
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      throw error;
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleToggleRecording}
      disabled={disabled || isProcessing}
      className={`transition-all duration-200 ${className} ${
        isRecording 
          ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' 
          : 'hover:bg-secondary'
      }`}
      title={isRecording ? "Stop recording" : "Start voice input"}
    >
      {isProcessing ? (
        <Volume2 className="w-4 h-4 animate-pulse" />
      ) : isRecording ? (
        <div className="relative">
          <MicOff className="w-4 h-4" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-ping" />
        </div>
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </Button>
  );
};