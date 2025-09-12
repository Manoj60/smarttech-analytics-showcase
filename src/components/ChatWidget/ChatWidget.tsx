import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageCircle, X, Send, User, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import ChatUserForm from './ChatUserForm';
import TypingIndicator from './TypingIndicator';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

interface ChatWidgetProps {
  className?: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ className }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationSecret, setConversationSecret] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (conversationId && conversationSecret) {
      loadMessageHistory();
    }
  }, [conversationId, conversationSecret]);

  const loadMessageHistory = async () => {
    if (!conversationId || !conversationSecret) return;

    try {
      const { data, error } = await supabase.functions.invoke('chat-support', {
        body: {
          action: 'history',
          conversationId: conversationId,
          conversationSecret: conversationSecret
        }
      });

      if (error) {
        console.error('Error loading message history:', error);
        return;
      }

      const response = data;
      if (response.error) {
        console.error('Server error loading history:', response.error);
        return;
      }

      setMessages((response.messages || []).map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role as 'user' | 'assistant',
        created_at: msg.created_at
      })));
    } catch (error) {
      console.error('Error loading message history:', error);
    }
  };

  const handleUserInfoSubmit = (info: { name: string; email: string }) => {
    setUserInfo(info);
    setMessages([{
      id: 'welcome',
      content: `Hi ${info.name}! I'm here to help you with any questions about our products and services. How can I assist you today?`,
      role: 'assistant',
      created_at: new Date().toISOString()
    }]);
    
    // Start inactivity timer when chat begins
    resetInactivityTimer();
  };

  // Reset inactivity timer on user activity
  const resetInactivityTimer = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    
    if (userInfo && isOpen) {
      const timer = setTimeout(() => {
        handleAutoClose();
      }, 2 * 60 * 1000); // 2 minutes
      
      setInactivityTimer(timer);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !userInfo || isSending) return;

    // Reset inactivity timer on message send
    resetInactivityTimer();

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      content: currentMessage,
      role: 'user',
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsSending(true);
    setIsTyping(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-support', {
        body: {
          message: currentMessage,
          conversationId: conversationId,
          conversationSecret: conversationSecret,
          userName: userInfo.name,
          userEmail: userInfo.email,
          action: 'send'
        }
      });

      if (error) {
        throw error;
      }

      const response = data;
      
      if (response.error) {
        throw new Error(response.error);
      }

      // Update conversation credentials if this is a new conversation
      if (!conversationId && response.conversationId) {
        setConversationId(response.conversationId);
        setConversationSecret(response.conversationSecret);
        
        // Store in localStorage for persistence
        localStorage.setItem('chatConversationId', response.conversationId);
        localStorage.setItem('chatConversationSecret', response.conversationSecret);
      }

      // Use the complete message history from the server response
      if (response.messages) {
        setMessages(response.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role as 'user' | 'assistant',
          created_at: msg.created_at
        })));
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      
      // Remove the temporary message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendTranscript = async (reason: 'manual_close' | 'timeout' | 'user_close') => {
    if (!userInfo || messages.length === 0) return;

    try {
      await supabase.functions.invoke('send-chat-transcript', {
        body: {
          userName: userInfo.name,
          userEmail: userInfo.email,
          messages: messages,
          reason: reason
        }
      });
      
      toast({
        title: "Transcript Sent",
        description: "A copy of your conversation has been sent to your email.",
      });
    } catch (error) {
      console.error('Error sending transcript:', error);
      toast({
        title: "Warning",
        description: "Chat ended but transcript could not be sent.",
        variant: "destructive",
      });
    }
  };

  const handleAutoClose = async () => {
    await sendTranscript('timeout');
    resetChat();
    setIsOpen(false);
    toast({
      title: "Chat Timeout",
      description: "Chat closed due to inactivity. Transcript sent to your email.",
    });
  };

  const handleCloseClick = () => {
    if (userInfo && messages.length > 1) { // More than just welcome message
      setShowCloseDialog(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleContinueChat = () => {
    setShowCloseDialog(false);
    resetInactivityTimer();
  };

  const handleEndChat = async () => {
    setShowCloseDialog(false);
    await sendTranscript('user_close');
    resetChat();
    setIsOpen(false);
  };

  const resetChat = () => {
    // Clear inactivity timer
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      setInactivityTimer(null);
    }
    
    setUserInfo(null);
    setMessages([]);
    setConversationId(null);
    setConversationSecret(null);
    setCurrentMessage('');
    setIsTyping(false);
    setIsSending(false);
    
    // Clear localStorage
    localStorage.removeItem('chatConversationId');
    localStorage.removeItem('chatConversationSecret');
  };

  // Load conversation from localStorage on component mount
  useEffect(() => {
    const savedConversationId = localStorage.getItem('chatConversationId');
    const savedConversationSecret = localStorage.getItem('chatConversationSecret');
    
    if (savedConversationId && savedConversationSecret) {
      setConversationId(savedConversationId);
      setConversationSecret(savedConversationSecret);
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, [inactivityTimer]);

  // Reset timer when user types
  useEffect(() => {
    if (currentMessage && userInfo) {
      resetInactivityTimer();
    }
  }, [currentMessage]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
          size="icon"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      ) : (
        <Card className="w-96 h-[500px] shadow-xl border-0 bg-background">
          <CardHeader className="flex flex-row items-center justify-between p-4 bg-primary text-white">
            <CardTitle className="text-lg font-semibold">Smart Tech Analytics Virtual Assistant</CardTitle>
            <Button
              onClick={handleCloseClick}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="p-0 h-[calc(100%-80px)] flex flex-col">
            {!userInfo ? (
              <ChatUserForm onSubmit={handleUserInfoSubmit} />
            ) : (
              <>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`flex max-w-[80%] ${
                            message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                          } items-start gap-2`}
                        >
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              message.role === 'user'
                                ? 'bg-primary text-white'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            {message.role === 'user' ? (
                              <User className="h-4 w-4" />
                            ) : (
                              <Bot className="h-4 w-4" />
                            )}
                          </div>
                          <div
                            className={`px-3 py-2 rounded-lg ${
                              message.role === 'user'
                                ? 'bg-primary text-white'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {isTyping && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      disabled={isSending}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!currentMessage.trim() || isSending}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-muted-foreground">
                      Chatting as {userInfo.name}
                    </p>
                    <Button
                      onClick={resetChat}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Start New Chat
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Close Confirmation Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Chat Session?</DialogTitle>
            <DialogDescription>
              Would you like to continue chatting or end this conversation? 
              If you end the chat, a transcript will be sent to your email.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleContinueChat}>
              Continue Chatting
            </Button>
            <Button onClick={handleEndChat}>
              End & Send Transcript
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatWidget;