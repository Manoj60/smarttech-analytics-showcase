import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ChatUserFormProps {
  onSubmit: (userInfo: { name: string; email: string }) => void;
}

const ChatUserForm: React.FC<ChatUserFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { name?: string; email?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    onSubmit({ name: name.trim(), email: email.trim() });
  };

  return (
    <div className="p-6 h-full flex flex-col justify-center">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Smart Tech Analytics Virtual Assistant
        </h3>
        <p className="text-sm text-muted-foreground">
          Please provide your details to start chatting with our Smart Tech Analytics assistant
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-sm font-medium">
            Your Name
          </Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            className={`mt-1 ${errors.name ? 'border-destructive' : ''}`}
          />
          {errors.name && (
            <p className="text-xs text-destructive mt-1">{errors.name}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="email" className="text-sm font-medium">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className={`mt-1 ${errors.email ? 'border-destructive' : ''}`}
          />
          {errors.email && (
            <p className="text-xs text-destructive mt-1">{errors.email}</p>
          )}
        </div>
        
        <Button type="submit" className="w-full">
          Start Chat
        </Button>
      </form>
      
      <p className="text-xs text-muted-foreground text-center mt-4">
        Your information is secure and will only be used for this support session.
      </p>
    </div>
  );
};

export default ChatUserForm;