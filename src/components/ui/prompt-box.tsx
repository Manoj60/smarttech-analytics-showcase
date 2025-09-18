import React, { useState, useRef } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Textarea } from './textarea';
import { Badge } from './badge';
import { 
  Send, 
  Paperclip, 
  X, 
  FileText, 
  Image, 
  File,
  Mic,
  Smile
} from 'lucide-react';

interface AttachedFile {
  id: string;
  file: File;
  type: 'image' | 'document' | 'other';
  preview?: string;
}

interface PromptBoxProps {
  onSubmit?: (prompt: string, files: File[]) => void;
  placeholder?: string;
  maxFiles?: number;
  allowedFileTypes?: string[];
  className?: string;
}

export const PromptBox: React.FC<PromptBoxProps> = ({
  onSubmit,
  placeholder = "Enter your prompt here...",
  maxFiles = 5,
  allowedFileTypes = ['image/*', '.pdf', '.doc', '.docx', '.txt'],
  className = ''
}) => {
  const [prompt, setPrompt] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getFileType = (file: File): 'image' | 'document' | 'other' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) return 'document';
    return 'other';
  };

  const getFileIcon = (type: 'image' | 'document' | 'other') => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  const handleFileSelect = (files: FileList) => {
    const newFiles: AttachedFile[] = [];
    
    Array.from(files).slice(0, maxFiles - attachedFiles.length).forEach(file => {
      const fileType = getFileType(file);
      const attachedFile: AttachedFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        type: fileType
      };

      // Create preview for images
      if (fileType === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          attachedFile.preview = e.target?.result as string;
          setAttachedFiles(prev => prev.map(f => f.id === attachedFile.id ? attachedFile : f));
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(attachedFile);
    });

    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSubmit = () => {
    if (!prompt.trim() && attachedFiles.length === 0) return;
    
    onSubmit?.(prompt, attachedFiles.map(af => af.file));
    setPrompt('');
    setAttachedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  React.useEffect(() => {
    adjustTextareaHeight();
  }, [prompt]);

  return (
    <Card className={`w-full gradient-card border-border shadow-medium ${className}`}>
      <CardContent className="p-4">
        {/* Attached Files */}
        {attachedFiles.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {attachedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 bg-secondary/50 rounded-lg p-2 group"
                >
                  {file.preview ? (
                    <img 
                      src={file.preview} 
                      alt={file.file.name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                      {getFileIcon(file.type)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(file.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drag and Drop Area */}
        <div
          className={`relative ${isDragging ? 'ring-2 ring-primary ring-offset-2 rounded-lg' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Textarea */}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="min-h-[60px] max-h-[120px] resize-none pr-24 border-border focus:ring-primary"
              style={{ height: 'auto' }}
            />
            
            {/* Action Buttons */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={attachedFiles.length >= maxFiles}
                className="p-2 h-auto hover:bg-secondary"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="p-2 h-auto hover:bg-secondary"
                title="Add emoji"
              >
                <Smile className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="p-2 h-auto hover:bg-secondary"
                title="Voice input"
              >
                <Mic className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Drag Overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Paperclip className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-primary font-medium">Drop files here</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Row */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {attachedFiles.length}/{maxFiles} files
            </Badge>
            {prompt.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {prompt.length} chars
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              Ctrl+Enter to send
            </p>
            <Button
              onClick={handleSubmit}
              disabled={!prompt.trim() && attachedFiles.length === 0}
              size="sm"
            >
              <Send className="w-4 h-4 mr-1" />
              Send
            </Button>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedFileTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};