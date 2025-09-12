-- Add conversation timeout and enhanced features
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS timeout_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'guest',
ADD COLUMN IF NOT EXISTS thread_id UUID,
ADD COLUMN IF NOT EXISTS is_threaded BOOLEAN DEFAULT false;

-- Create conversation threads table for message threading
CREATE TABLE IF NOT EXISTS conversation_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  thread_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on conversation_threads
ALTER TABLE conversation_threads ENABLE ROW LEVEL SECURITY;

-- Create policies for conversation_threads
CREATE POLICY "Service role thread access" 
ON conversation_threads 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Deny public thread access" 
ON conversation_threads 
FOR ALL 
USING (false) 
WITH CHECK (false);

-- Add thread_id to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES conversation_threads(id) ON DELETE SET NULL;

-- Create function to update conversation activity
CREATE OR REPLACE FUNCTION update_conversation_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET 
    last_activity_at = now(),
    timeout_at = now() + INTERVAL '30 minutes'
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update activity on new messages
DROP TRIGGER IF EXISTS update_conversation_activity_trigger ON messages;
CREATE TRIGGER update_conversation_activity_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_activity();

-- Create function to cleanup expired conversations
CREATE OR REPLACE FUNCTION cleanup_expired_conversations()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE conversations 
  SET status = 'expired'
  WHERE status = 'active' 
    AND timeout_at < now();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;