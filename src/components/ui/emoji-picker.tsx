import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Smile } from 'lucide-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
  className?: string;
}

const EMOJI_CATEGORIES = {
  'Frequently Used': ['😊', '👍', '❤️', '😂', '🔥', '👏', '✨', '💡'],
  'Smileys': ['😀', '😊', '😍', '🤔', '😅', '😂', '🥰', '😎', '🤗', '😴', '😬', '🤝'],
  'Gestures': ['👍', '👎', '👏', '🙌', '👋', '✋', '🤝', '💪', '🙏', '👌', '✌️', '🤞'],
  'Objects': ['💡', '🔥', '⭐', '✨', '🎯', '📊', '📈', '💰', '🎉', '🚀', '⚡', '🔧'],
  'Symbols': ['❤️', '💚', '💙', '💜', '🧡', '💛', '✅', '❌', '⚠️', '📍', '🔔', '💯']
};

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onEmojiSelect,
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Frequently Used');
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current && 
        !pickerRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  const togglePicker = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        ref={buttonRef}
        type="button"
        variant="ghost"
        size="sm"
        onClick={togglePicker}
        disabled={disabled}
        className="p-2 h-auto hover:bg-secondary"
        title="Add emoji"
      >
        <Smile className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div 
          ref={pickerRef}
          className="absolute bottom-full right-0 mb-2 z-50"
        >
          <Card className="w-80 gradient-card border-border shadow-strong">
            <CardContent className="p-4">
              {/* Category Tabs */}
              <div className="flex gap-1 mb-3 overflow-x-auto">
                {Object.keys(EMOJI_CATEGORIES).map((category) => (
                  <Button
                    key={category}
                    variant={activeCategory === category ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveCategory(category)}
                    className="text-xs whitespace-nowrap flex-shrink-0"
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {/* Emoji Grid */}
              <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji, index) => (
                  <Button
                    key={`${emoji}-${index}`}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEmojiClick(emoji)}
                    className="p-2 h-8 w-8 text-lg hover:bg-secondary transition-colors"
                    title={emoji}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>

              {/* Recently Used (if you want to implement this later) */}
              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-xs text-muted-foreground mb-2">Quick Access</div>
                <div className="flex gap-1">
                  {EMOJI_CATEGORIES['Frequently Used'].slice(0, 6).map((emoji, index) => (
                    <Button
                      key={`quick-${emoji}-${index}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEmojiClick(emoji)}
                      className="p-1 h-6 w-6 text-sm hover:bg-secondary"
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};