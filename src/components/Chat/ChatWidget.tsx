import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { MessageCircle, X, Send, User, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

interface ChatSession {
  userName: string;
  userEmail: string;
  conversationId: string | null;
  messages: Message[];
}

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [session, setSession] = useState<ChatSession>({
    userName: '',
    userEmail: '',
    conversationId: null,
    messages: []
  });

  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages, isTyping]);

  useEffect(() => {
    if (isOpen && isRegistered && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isRegistered]);

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session.userName.trim() || !session.userEmail.trim()) {
      toast({
        title: "Required fields",
        description: "Please enter both name and email",
        variant: "destructive"
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(session.userEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsRegistered(true);
    toast({
      title: "Welcome!",
      description: "You can now start chatting with our support assistant."
    });
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    setIsLoading(true);

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: Date.now().toString(),
      content: userMessage,
      role: 'user',
      created_at: new Date().toISOString()
    };

    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, tempUserMessage]
    }));

    setIsTyping(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-support', {
        body: {
          message: userMessage,
          conversationId: session.conversationId,
          userName: session.userName,
          userEmail: session.userEmail
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        role: 'assistant',
        created_at: new Date().toISOString()
      };

      setSession(prev => ({
        ...prev,
        conversationId: data.conversationId,
        messages: [...prev.messages, assistantMessage]
      }));

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const resetChat = () => {
    setSession({
      userName: '',
      userEmail: '',
      conversationId: null,
      messages: []
    });
    setIsRegistered(false);
    setCurrentMessage('');
  };

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl z-50 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Support Chat</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-muted-foreground">Online</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {!isRegistered ? (
              /* Registration Form */
              <div className="p-4 flex-1 flex flex-col justify-center">
                <div className="text-center mb-6">
                  <h3 className="font-semibold mb-2">Welcome to Support Chat</h3>
                  <p className="text-sm text-muted-foreground">
                    Please provide your details to get started
                  </p>
                </div>
                
                <form onSubmit={handleRegistration} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Your name"
                      value={session.userName}
                      onChange={(e) => setSession(prev => ({ ...prev, userName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Your email"
                      value={session.userEmail}
                      onChange={(e) => setSession(prev => ({ ...prev, userEmail: e.target.value }))}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Start Chat
                  </Button>
                </form>
              </div>
            ) : (
              /* Chat Interface */
              <>
                {/* Messages */}
                <ScrollArea className="flex-1 px-4">
                  <div className="space-y-4 py-4">
                    {session.messages.length === 0 && (
                      <div className="text-center py-8">
                        <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Hi {session.userName}! How can I help you today?
                        </p>
                      </div>
                    )}
                    
                    {session.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                        
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className={`text-xs mt-1 opacity-70`}>
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                        
                        {message.role === 'user' && (
                          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-secondary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Typing Indicator */}
                    {isTyping && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div className="bg-muted rounded-lg px-3 py-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      placeholder="Type your message..."
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!currentMessage.trim() || isLoading}
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                      Logged in as {session.userName}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetChat}
                      className="text-xs"
                    >
                      New Chat
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default ChatWidget;