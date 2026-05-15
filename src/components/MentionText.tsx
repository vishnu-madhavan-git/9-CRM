import React from 'react';
import { cn } from '../lib/utils';

interface MentionTextProps {
  text: string;
  className?: string;
}

export default function MentionText({ text, className }: MentionTextProps) {
  if (!text) return null;

  // Regex to find @Mention patterns (assuming mentions don't have spaces as handled by our selectMember)
  const parts = text.split(/(@\w+)/g);

  return (
    <p className={cn("text-sm leading-relaxed", className)}>
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          return (
            <span 
              key={i} 
              className="font-black text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md mx-0.5"
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}
