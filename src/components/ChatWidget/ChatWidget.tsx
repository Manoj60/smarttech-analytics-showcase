import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (conversationId) {
      loadMessageHistory();
    }
  }, [conversationId]);

  const loadMessageHistory = async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading message history:', error);
        return;
      }

      setMessages((data || []).map(msg => ({
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
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !userInfo || isSending) return;

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
          userName: userInfo.name,
          userEmail: userInfo.email
        }
      });

      if (error) {
        throw error;
      }

      const response = data;
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (!conversationId && response.conversationId) {
        setConversationId(response.conversationId);
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: response.message,
        role: 'assistant',
        created_at: new Date().toISOString()
      };

      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id ? { ...userMessage, id: `user-${Date.now()}` } : msg
      ).concat(assistantMessage));

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

  const resetChat = () => {
    setUserInfo(null);
    setMessages([]);
    setConversationId(null);
    setCurrentMessage('');
    setIsTyping(false);
    setIsSending(false);
  };

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
              onClick={() => setIsOpen(false)}
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
    </div>
  );
};

export default ChatWidget;