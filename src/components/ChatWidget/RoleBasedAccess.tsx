import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Crown, User } from 'lucide-react';

type UserRole = 'guest' | 'user' | 'premium' | 'admin';

interface RoleBasedAccessProps {
  userRole: UserRole;
  userEmail?: string;
  showBadge?: boolean;
}

const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  userRole,
  userEmail,
  showBadge = true
}) => {
  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Admin',
          icon: Crown,
          color: 'bg-destructive text-destructive-foreground',
          description: 'Full access to all features'
        };
      case 'premium':
        return {
          label: 'Premium',
          icon: Shield,
          color: 'bg-primary text-primary-foreground',
          description: 'Advanced features available'
        };
      case 'user':
        return {
          label: 'User',
          icon: User,
          color: 'bg-secondary text-secondary-foreground',
          description: 'Standard user access'
        };
      default:
        return {
          label: 'Guest',
          icon: Users,
          color: 'bg-muted text-muted-foreground',
          description: 'Basic access only'
        };
    }
  };

  const config = getRoleConfig(userRole);
  const IconComponent = config.icon;

  // Check if user has access to advanced features
  const hasAdvancedAccess = userRole === 'admin' || userRole === 'premium';
  const hasThreadingAccess = userRole !== 'guest';
  const hasExportAccess = userRole !== 'guest';
  const hasPrioritySupport = userRole === 'admin' || userRole === 'premium';

  if (!showBadge) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`${config.color} flex items-center gap-1`}>
          <IconComponent className="h-3 w-3" />
          <span className="text-xs">{config.label}</span>
        </Badge>
        {hasPrioritySupport && (
          <Badge variant="outline" className="text-xs">
            Priority Support
          </Badge>
        )}
      </div>
      
      {userRole === 'guest' && (
        <div className="text-xs text-muted-foreground">
          <p>Limited features available. Sign up for full access to:</p>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>Conversation export</li>
            <li>Extended chat history</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default RoleBasedAccess;

// Helper functions for role-based feature access
export const canUseThreading = (_userRole: UserRole): boolean => {
  return true; // enable threading for all users, including guests
};

export const canExportConversations = (userRole: UserRole): boolean => {
  return userRole !== 'guest';
};

export const canAccessAdvancedFeatures = (userRole: UserRole): boolean => {
  return userRole === 'admin' || userRole === 'premium';
};

export const getMessageLimit = (userRole: UserRole): number => {
  switch (userRole) {
    case 'admin':
      return -1; // Unlimited
    case 'premium':
      return 500;
    case 'user':
      return 50;
    default:
      return 10; // Guest limit
  }
};

export const getConversationTimeout = (userRole: UserRole): number => {
  switch (userRole) {
    case 'admin':
    case 'premium':
      return 60; // 60 minutes
    case 'user':
      return 30; // 30 minutes
    default:
      return 15; // 15 minutes for guests
  }
};