import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Textarea } from './textarea';
import { Badge } from './badge';
import { 
  Send, 
  Paperclip, 
  X, 
  FileText, 
  Image, 
  File,
  Mic,
  Smile,
  Bot,
  User,
  Copy,
  Volume2,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  Share2,
  Check
} from 'lucide-react';

interface AttachedFile {
  id: string;
  file: File;
  type: 'image' | 'document' | 'other';
  preview?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  files?: AttachedFile[];
  timestamp: Date;
  rating?: 'up' | 'down' | null;
  copied?: boolean;
}

interface PromptBoxProps {
  onSubmit?: (prompt: string, files: File[]) => void;
  placeholder?: string;
  maxFiles?: number;
  allowedFileTypes?: string[];
  className?: string;
  showConversation?: boolean;
  onClose?: () => void;
}

export const PromptBox: React.FC<PromptBoxProps> = ({
  onSubmit,
  placeholder = "Enter your prompt here...",
  maxFiles = 5,
  allowedFileTypes = ['image/*', '.pdf', '.doc', '.docx', '.txt'],
  className = '',
  showConversation = true,
  onClose
}) => {
  const [prompt, setPrompt] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getFileType = (file: File): 'image' | 'document' | 'other' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) return 'document';
    return 'other';
  };

  const getFileIcon = (type: 'image' | 'document' | 'other') => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  const handleFileSelect = (files: FileList) => {
    const newFiles: AttachedFile[] = [];
    
    Array.from(files).slice(0, maxFiles - attachedFiles.length).forEach(file => {
      const fileType = getFileType(file);
      const attachedFile: AttachedFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        type: fileType
      };

      // Create preview for images
      if (fileType === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          attachedFile.preview = e.target?.result as string;
          setAttachedFiles(prev => prev.map(f => f.id === attachedFile.id ? attachedFile : f));
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(attachedFile);
    });

    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessage(messageId);
      setTimeout(() => setCopiedMessage(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleRateMessage = (messageId: string, rating: 'up' | 'down') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, rating: msg.rating === rating ? null : rating }
        : msg
    ));
  };

  const handleVoiceMessage = (messageId: string, content: string) => {
    if (playingVoice === messageId) {
      // Stop current speech
      speechSynthesis.cancel();
      setPlayingVoice(null);
    } else {
      // Stop any current speech and start new one
      speechSynthesis.cancel();
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(content);
        utterance.rate = 0.8;
        utterance.onstart = () => setPlayingVoice(messageId);
        utterance.onend = () => setPlayingVoice(null);
        utterance.onerror = () => setPlayingVoice(null);
        speechSynthesis.speak(utterance);
      }
    }
  };

  const handleShareMessage = (content: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'AI Response',
        text: content,
      });
    } else {
      handleCopyMessage('share', content);
    }
  };

  const generateMorePrecise = async (messageId: string, originalContent: string) => {
    setIsTyping(true);
    
    setTimeout(() => {
      const preciseResponse = `${originalContent}\n\nFor more specific details: Our solutions are tailored to your exact requirements. We typically conduct a thorough analysis of your current systems, identify key improvement areas, and develop a customized implementation roadmap. Would you like to schedule a detailed consultation to discuss your specific needs?`;
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: preciseResponse }
          : msg
      ));
      setIsTyping(false);
    }, 1000);
  };

  const generateResponse = async (userPrompt: string, files: AttachedFile[]) => {
    try {
      // Call the AI query assistant edge function
      const { data, error } = await supabase.functions.invoke('ai-query-assistant', {
        body: {
          query: userPrompt,
          files: files.map(f => f.file.name)
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        return "I apologize, but I'm experiencing technical difficulties. Please try again later or contact our support team for assistance.";
      }

      return data.response || "Thank you for your inquiry! Our team would be happy to help you with your requirements.";
    } catch (error) {
      console.error('Error calling AI assistant:', error);
      return "Thank you for your inquiry! Our team of AI and analytics experts would be happy to help you with your requirements. Based on your description, we can provide customized solutions that align with your business objectives.";
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim() && attachedFiles.length === 0) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      files: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
      timestamp: new Date()
    };

    if (showConversation) {
      setMessages(prev => [...prev, userMessage]);
      setIsTyping(true);
    }

    // Call external onSubmit if provided
    onSubmit?.(prompt, attachedFiles.map(af => af.file));
    
    const currentPrompt = prompt;
    const currentFiles = [...attachedFiles];
    
    setPrompt('');
    setAttachedFiles([]);

    if (showConversation) {
      // Generate AI response
      setTimeout(async () => {
        const responseContent = await generateResponse(currentPrompt, currentFiles);
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responseContent,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsTyping(false);
      }, 1500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  React.useEffect(() => {
    adjustTextareaHeight();
  }, [prompt]);

  return (
    <div className={`w-full ${className}`}>

      {/* Conversation History - Hidden when minimized */}
      {showConversation && !isMinimized && messages.length > 0 && (
        <Card className="mb-4 gradient-card border-border shadow-soft">
          <CardContent className="p-4">
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-primary' 
                      : 'bg-secondary'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-primary-foreground" />
                    ) : (
                      <Bot className="w-4 h-4 text-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div
                      className={`px-4 py-3 rounded-lg max-w-[85%] ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-secondary text-foreground'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    {/* Message Actions - Only for assistant messages */}
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-1 max-w-[85%]">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyMessage(message.id, message.content)}
                          className="h-8 w-8 p-0 hover:bg-secondary/80"
                          title="Copy message"
                        >
                          {copiedMessage === message.id ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVoiceMessage(message.id, message.content)}
                          className={`h-8 w-8 p-0 hover:bg-secondary/80 ${
                            playingVoice === message.id ? 'text-primary bg-primary/10' : ''
                          }`}
                          title={playingVoice === message.id ? "Stop reading" : "Read aloud"}
                        >
                          <Volume2 className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRateMessage(message.id, 'up')}
                          className={`h-8 w-8 p-0 hover:bg-secondary/80 ${
                            message.rating === 'up' ? 'text-green-600' : ''
                          }`}
                          title="Good response"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRateMessage(message.id, 'down')}
                          className={`h-8 w-8 p-0 hover:bg-secondary/80 ${
                            message.rating === 'down' ? 'text-red-600' : ''
                          }`}
                          title="Poor response"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => generateMorePrecise(message.id, message.content)}
                          className="h-8 w-8 p-0 hover:bg-secondary/80"
                          title="More precise"
                        >
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShareMessage(message.content)}
                          className="h-8 w-8 p-0 hover:bg-secondary/80"
                          title="Share"
                        >
                          <Share2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    {message.files && message.files.length > 0 && (
                      <div className="flex flex-wrap gap-2 max-w-[85%]">
                        {message.files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-2 bg-background/50 rounded-lg p-2 text-xs"
                          >
                            {file.preview ? (
                              <img 
                                src={file.preview} 
                                alt={file.file.name}
                                className="w-6 h-6 rounded object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                                {getFileIcon(file.type)}
                              </div>
                            )}
                            <span className="text-muted-foreground">{file.file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-foreground" />
                  </div>
                  <div className="px-4 py-3 rounded-lg bg-secondary text-foreground">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input Card - Always visible unless completely closed */}
      {!isMinimized && (
        <Card className="gradient-card border-border shadow-medium">
      <CardContent className="p-4">
        {/* Attached Files */}
        {attachedFiles.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {attachedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 bg-secondary/50 rounded-lg p-2 group"
                >
                  {file.preview ? (
                    <img 
                      src={file.preview} 
                      alt={file.file.name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                      {getFileIcon(file.type)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(file.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drag and Drop Area */}
        <div
          className={`relative ${isDragging ? 'ring-2 ring-primary ring-offset-2 rounded-lg' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Textarea */}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="min-h-[60px] max-h-[120px] resize-none pr-24 border-border focus:ring-primary"
              style={{ height: 'auto' }}
            />
            
            {/* Action Buttons */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={attachedFiles.length >= maxFiles}
                className="p-2 h-auto hover:bg-secondary"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="p-2 h-auto hover:bg-secondary"
                title="Add emoji"
              >
                <Smile className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="p-2 h-auto hover:bg-secondary"
                title="Voice input"
              >
                <Mic className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Drag Overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Paperclip className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-primary font-medium">Drop files here</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Row */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {attachedFiles.length}/{maxFiles} files
            </Badge>
            {prompt.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {prompt.length} chars
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              Ctrl+Enter to send
            </p>
            <Button
              onClick={handleSubmit}
              disabled={!prompt.trim() && attachedFiles.length === 0}
              size="sm"
            >
              <Send className="w-4 h-4 mr-1" />
              Send
            </Button>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedFileTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />
      </CardContent>
    </Card>
      )}
    </div>
  );
};