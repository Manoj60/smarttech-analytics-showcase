import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Share2, Linkedin, Facebook } from 'lucide-react';
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

  const generateSharableContent = () => {
    // Create privacy-compliant shareable content (no personal info)
    const messageCount = messages.length;
    const conversationSummary = `I just had an insightful ${messageCount}-message conversation with Smart Tech Analytics' AI assistant about business solutions. Their AI technology is impressive!`;
    
    return {
      text: conversationSummary,
      url: window.location.origin,
      hashtags: 'AI,SmartTechAnalytics,BusinessSolutions,Innovation'
    };
  };

  const shareToLinkedIn = () => {
    const content = generateSharableContent();
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(content.url)}&text=${encodeURIComponent(content.text)}`;
    
    window.open(linkedInUrl, '_blank', 'width=600,height=600');
    
    toast({
      title: "Sharing to LinkedIn",
      description: "LinkedIn sharing window opened.",
      variant: "default",
    });
  };

  const shareToFacebook = () => {
    const content = generateSharableContent();
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(content.url)}&quote=${encodeURIComponent(content.text)}`;
    
    window.open(facebookUrl, '_blank', 'width=600,height=600');
    
    toast({
      title: "Sharing to Facebook",
      description: "Facebook sharing window opened.",
      variant: "default",
    });
  };

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
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
      
      <div className="flex gap-2">
        <Button
          onClick={shareToLinkedIn}
          variant="outline"
          size="sm"
          className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <Linkedin className="h-3 w-3" />
          LinkedIn
        </Button>
        <Button
          onClick={shareToFacebook}
          variant="outline"
          size="sm"
          className="flex items-center gap-1 text-blue-800 border-blue-200 hover:bg-blue-50"
        >
          <Facebook className="h-3 w-3" />
          Facebook
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={() => {
            if (navigator.share) {
              const content = generateSharableContent();
              navigator.share({
                title: 'Smart Tech Analytics AI Conversation',
                text: content.text,
                url: content.url
              });
            } else {
              const content = generateSharableContent();
              navigator.clipboard.writeText(`${content.text} ${content.url}`);
              toast({
                title: "Copied to Clipboard",
                description: "Share content copied to clipboard.",
                variant: "default",
              });
            }
          }}
        >
          <Share2 className="h-3 w-3" />
          Share
        </Button>
      </div>
    </div>
  );
};

export default ConversationExporter;