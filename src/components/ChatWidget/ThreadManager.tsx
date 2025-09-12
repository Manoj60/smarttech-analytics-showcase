import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageSquarePlus, MessageSquare, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Thread {
  id: string;
  thread_name: string;
  created_by: string;
  created_at: string;
  is_active: boolean;
}

interface ThreadManagerProps {
  threads: Thread[];
  currentThreadId: string | null;
  onCreateThread: (threadName: string) => Promise<void>;
  onSelectThread: (threadId: string | null) => void;
  onCloseThread: (threadId: string) => Promise<void>;
  userName: string;
  disabled?: boolean;
}

const ThreadManager: React.FC<ThreadManagerProps> = ({
  threads,
  currentThreadId,
  onCreateThread,
  onSelectThread,
  onCloseThread,
  userName,
  disabled = false
}) => {
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newThreadName, setNewThreadName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateThread = async () => {
    if (!newThreadName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a thread name.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      await onCreateThread(newThreadName.trim());
      setNewThreadName('');
      setShowCreateForm(false);
      toast({
        title: "Thread Created",
        description: `Thread "${newThreadName}" created successfully.`,
      });
    } catch (error) {
      console.error('Error creating thread:', error);
      toast({
        title: "Error",
        description: "Failed to create thread. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseThread = async (threadId: string) => {
    try {
      await onCloseThread(threadId);
      toast({
        title: "Thread Closed",
        description: "Thread has been closed successfully.",
      });
    } catch (error) {
      console.error('Error closing thread:', error);
      toast({
        title: "Error",
        description: "Failed to close thread. Please try again.",
        variant: "destructive",
      });
    }
  };

  const activeThreads = threads.filter(t => t.is_active);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Discussion Threads</span>
          {currentThreadId && (
            <Badge variant="secondary" className="text-xs">
              {activeThreads.find(t => t.id === currentThreadId)?.thread_name || 'Thread'}
            </Badge>
          )}
        </div>
        {!disabled && (
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <MessageSquarePlus className="h-3 w-3" />
          </Button>
        )}
      </div>

      {showCreateForm && (
        <div className="space-y-2 p-2 bg-muted/30 rounded-md">
          <Input
            value={newThreadName}
            onChange={(e) => setNewThreadName(e.target.value)}
            placeholder="Enter thread name..."
            disabled={isCreating}
            className="h-8 text-sm"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateThread();
              }
            }}
          />
          <div className="flex gap-1">
            <Button
              onClick={handleCreateThread}
              disabled={isCreating || !newThreadName.trim()}
              size="sm"
              className="h-6 text-xs"
            >
              Create
            </Button>
            <Button
              onClick={() => {
                setShowCreateForm(false);
                setNewThreadName('');
              }}
              variant="outline"
              size="sm"
              className="h-6 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {activeThreads.length > 0 && (
        <div className="space-y-1">
          <Select
            value={currentThreadId || 'main'}
            onValueChange={(value) => onSelectThread(value === 'main' ? null : value)}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="main">Main Conversation</SelectItem>
              {activeThreads.map((thread) => (
                <SelectItem key={thread.id} value={thread.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{thread.thread_name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      by {thread.created_by}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {currentThreadId && activeThreads.find(t => t.id === currentThreadId)?.created_by === userName && !disabled && (
            <Button
              onClick={() => handleCloseThread(currentThreadId)}
              variant="outline"
              size="sm"
              className="w-full h-6 text-xs text-destructive hover:text-destructive"
            >
              <X className="h-3 w-3 mr-1" />
              Close Thread
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ThreadManager;