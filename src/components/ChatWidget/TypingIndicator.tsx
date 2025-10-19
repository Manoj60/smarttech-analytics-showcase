import React from 'react';


const TypingIndicator: React.FC = () => {
  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-2 max-w-[80%]">
        <div className="bg-muted text-foreground px-3 py-2 rounded-lg">
          <div className="flex items-center gap-1">
            <span className="text-sm">Typing</span>
            <div className="flex gap-1">
              <div
                className="w-1 h-1 bg-foreground/60 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <div
                className="w-1 h-1 bg-foreground/60 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <div
                className="w-1 h-1 bg-foreground/60 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;