import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageCircle, X, Send, User, Bot, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import ChatUserForm from './ChatUserForm';
import TypingIndicator from './TypingIndicator';
import ConversationExporter from './ConversationExporter';
import ThreadManager from './ThreadManager';
import RoleBasedAccess, { 
  canUseThreading, 
  canExportConversations, 
  getConversationTimeout, 
  getMessageLimit 
} from './RoleBasedAccess';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  thread_id?: string;
}

interface Thread {
  id: string;
  thread_name: string;
  created_by: string;
  created_at: string;
  is_active: boolean;
}

type UserRole = 'guest' | 'user' | 'premium' | 'admin';

interface ChatWidgetProps {
  className?: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ className }) => {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
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
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Determine user role based on authentication
  useEffect(() => {
    if (user && userProfile) {
      setUserRole(userProfile.role as UserRole);
    } else {
      setUserRole('guest');
    }
  }, [user, userProfile]);

  useEffect(() => {
    if (conversationId && conversationSecret) {
      loadMessageHistory();
    }
  }, [conversationId, conversationSecret, currentThreadId]);

  const loadMessageHistory = async () => {
    if (!conversationId || !conversationSecret) return;

    try {
      const { data, error } = await supabase.functions.invoke('chat-support', {
        body: {
          action: 'history',
          conversationId: conversationId,
          conversationSecret: conversationSecret,
          threadId: currentThreadId
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
        created_at: msg.created_at,
        thread_id: msg.thread_id
      })));

      if (response.threads) {
        setThreads(response.threads);
      }
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
      const timeoutMinutes = getConversationTimeout(userRole);
      const timer = setTimeout(() => {
        handleAutoClose();
      }, timeoutMinutes * 60 * 1000);
      
      setInactivityTimer(timer);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !userInfo || isSending) return;

    // Check message limit for user role
    const messageLimit = getMessageLimit(userRole);
    if (messageLimit > 0 && messages.length >= messageLimit) {
      toast({
        title: "Message Limit Reached",
        description: `${userRole} users can send up to ${messageLimit} messages. Please upgrade for unlimited access.`,
        variant: "destructive",
      });
      return;
    }

    // Reset inactivity timer on message send
    resetInactivityTimer();

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      content: currentMessage,
      role: 'user',
      created_at: new Date().toISOString(),
      thread_id: currentThreadId || undefined
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
          userRole: userRole,
          threadId: currentThreadId,
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
          created_at: msg.created_at,
          thread_id: msg.thread_id
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
        variant: "default",
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
      variant: "default",
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

  // Thread management functions
  const createThread = async (threadName: string) => {
    if (!conversationId || !conversationSecret || !userInfo) {
      throw new Error('No active conversation');
    }

    const { data, error } = await supabase.functions.invoke('chat-support', {
      body: {
        action: 'create_thread',
        conversationId: conversationId,
        conversationSecret: conversationSecret,
        threadName: threadName,
        userName: userInfo.name
      }
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    // Reload message history to get updated threads
    await loadMessageHistory();
    setCurrentThreadId(data.thread.id);
  };

  const selectThread = (threadId: string | null) => {
    setCurrentThreadId(threadId);
    // This will trigger loadMessageHistory via useEffect
  };

  const closeThread = async (threadId: string) => {
    if (!conversationId || !conversationSecret) {
      throw new Error('No active conversation');
    }

    const { data, error } = await supabase.functions.invoke('chat-support', {
      body: {
        action: 'close_thread',
        conversationId: conversationId,
        conversationSecret: conversationSecret,
        threadId: threadId
      }
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    // If we're currently in the closed thread, switch to main conversation
    if (currentThreadId === threadId) {
      setCurrentThreadId(null);
    }

    // Reload message history to get updated threads
    await loadMessageHistory();
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
    setThreads([]);
    setCurrentThreadId(null);
    setShowAdvancedOptions(false);
    
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
            <CardTitle className="text-lg font-semibold text-white">Smart Tech Analytics Virtual Assistant</CardTitle>
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
                  <div className="space-y-4 min-w-full">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`flex ${
                            message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                          } items-start gap-2 min-w-0`}
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
                            className={`px-3 py-2 rounded-lg min-w-0 max-w-full overflow-x-auto ${
                              message.role === 'user'
                                ? 'bg-primary text-white'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            <p className={`text-sm ${message.role === 'assistant' ? 'whitespace-pre' : 'whitespace-pre-wrap break-words'}`}>{message.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {isTyping && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                <div className="p-4 border-t space-y-3">
                  {/* Threading controls - only for non-guest users */}
                  {canUseThreading(userRole) && (
                    <ThreadManager
                      threads={threads}
                      currentThreadId={currentThreadId}
                      onCreateThread={createThread}
                      onSelectThread={selectThread}
                      onCloseThread={closeThread}
                      userName={userInfo.name}
                      disabled={isSending}
                    />
                  )}

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
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {userInfo.name} ({userRole})
                      </p>
                      <Button
                        onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      onClick={resetChat}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Start New Chat
                    </Button>
                  </div>

                  {/* Advanced options panel */}
                  {showAdvancedOptions && (
                    <div className="border-t pt-2 space-y-2">
                      {conversationId && (
                        <ConversationExporter
                          messages={messages}
                          userName={userInfo.name}
                          userEmail={userInfo.email}
                          conversationId={conversationId}
                        />
                      )}
                      {!canExportConversations(userRole) && (
                        <p className="text-xs text-muted-foreground">
                          File export features available for registered users
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Close Confirmation Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="bg-primary text-primary-foreground border-primary/20 shadow-medium font-body">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary-foreground">End Chat Session?</DialogTitle>
            <DialogDescription className="text-primary-foreground/80 font-body">
              Would you like to continue chatting or end this conversation? 
              If you end the chat, a transcript will be sent to your email.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button onClick={handleContinueChat} className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-body">
              Continue Chatting
            </Button>
            <Button onClick={handleEndChat} className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-body">
              End & Send Transcript
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatWidget;