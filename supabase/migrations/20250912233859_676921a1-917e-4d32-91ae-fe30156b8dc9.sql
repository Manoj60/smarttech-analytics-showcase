-- Fix security warnings by setting search_path for functions
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;