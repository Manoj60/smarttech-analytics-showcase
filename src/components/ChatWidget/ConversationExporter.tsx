import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  thread_id?: string;
}

interface ConversationExporterProps {
  messages: Message[];
  userName: string;
  userEmail: string;
  conversationId: string;
}

const ConversationExporter: React.FC<ConversationExporterProps> = ({
  messages,
  userName,
  userEmail,
  conversationId
}) => {
  const { toast } = useToast();

  const exportToJSON = () => {
    const exportData = {
      conversation_id: conversationId,
      user_name: userName,
      user_email: userEmail,
      exported_at: new Date().toISOString(),
      message_count: messages.length,
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        created_at: msg.created_at,
        thread_id: msg.thread_id || null
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-conversation-${conversationId.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Conversation exported as JSON file.",
      variant: "default",
    });
  };

  const exportToText = () => {
    const header = `Smart Tech Analytics - Chat Conversation Export
User: ${userName} (${userEmail})
Conversation ID: ${conversationId}
Exported: ${new Date().toLocaleString()}
Total Messages: ${messages.length}
${'='.repeat(60)}

`;

    const messageText = messages.map(msg => {
      const timestamp = new Date(msg.created_at).toLocaleString();
      const role = msg.role === 'user' ? 'You' : 'Assistant';
      const threadInfo = msg.thread_id ? ` [Thread: ${msg.thread_id.slice(0, 8)}]` : '';
      
      return `[${timestamp}] ${role}${threadInfo}:
${msg.content}

`;
    }).join('');

    const fullText = header + messageText;
    
    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-conversation-${conversationId.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Conversation exported as text file.",
      variant: "default",
    });
  };

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={exportToText}
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
      >
        <FileText className="h-3 w-3" />
        Export TXT
      </Button>
      <Button
        onClick={exportToJSON}
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
      >
        <Download className="h-3 w-3" />
        Export JSON
      </Button>
    </div>
  );
};

export default ConversationExporter;