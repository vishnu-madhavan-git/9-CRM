import React, { useState, useRef, useEffect } from 'react';
import type { TeamMember } from '../types';
import { cn } from '../lib/utils';
import { User } from 'lucide-react';

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  team: TeamMember[];
  className?: string;
}

export default function MentionTextarea({ value, onChange, placeholder, team, className }: MentionTextareaProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState('');
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const filteredTeam = team.filter(member => 
    member.name.toLowerCase().includes(suggestionFilter.toLowerCase()) ||
    member.email.toLowerCase().includes(suggestionFilter.toLowerCase())
  );

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1 && (lastAtSymbol === 0 || textBeforeCursor[lastAtSymbol - 1] === ' ')) {
      const filter = textBeforeCursor.slice(lastAtSymbol + 1);
      if (!filter.includes(' ')) {
        setSuggestionFilter(filter);
        setShowSuggestions(true);
        setSuggestionIndex(0);
        
        // Simple positioning logic
        const { selectionStart } = e.target;
        const lineBreaks = val.slice(0, selectionStart).split('\n').length;
        setCoords({
          top: 30 + (lineBreaks * 20),
          left: Math.min(filter.length * 8 + (lastAtSymbol * 8) % 300, 250)
        });
        return;
      }
    }
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionIndex(prev => (prev + 1) % filteredTeam.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionIndex(prev => (prev - 1 + filteredTeam.length) % filteredTeam.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectMember(filteredTeam[suggestionIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  const selectMember = (member: TeamMember) => {
    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = value.slice(cursorPosition);

    const newValue = `${value.slice(0, lastAtSymbol)}@${member.name.replace(/\s/g, '')} ${textAfterCursor}`;
    onChange(newValue);
    setShowSuggestions(false);
    
    setTimeout(() => {
        textareaRef.current?.focus();
        const newPos = lastAtSymbol + member.name.replace(/\s/g, '').length + 2;
        textareaRef.current?.setSelectionRange(newPos, newPos);
    }, 0);
  };

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "w-full bg-[#1A1A1A] border border-[#333] rounded-xl p-4 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none",
          className
        )}
        rows={3}
      />

      {showSuggestions && filteredTeam.length > 0 && (
        <div 
          className="absolute z-[100] bg-[#0A0A0A] border border-[#333] rounded-xl shadow-2xl w-64 overflow-hidden"
          style={{ top: coords.top, left: coords.left }}
        >
          <div className="p-2 border-b border-[#262626] bg-[#141414]">
             <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Mention Team Member</p>
          </div>
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            {filteredTeam.map((member, idx) => (
              <button
                key={member.id}
                onClick={() => selectMember(member)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-all",
                  idx === suggestionIndex ? "bg-indigo-600 text-white" : "hover:bg-[#1A1A1A] text-gray-400 hover:text-white"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  idx === suggestionIndex ? "bg-white/20" : "bg-[#262626]"
                )}>
                  <User size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{member.name}</p>
                  <p className={cn(
                    "text-[10px] truncate",
                    idx === suggestionIndex ? "text-indigo-100" : "text-gray-500"
                  )}>{member.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
