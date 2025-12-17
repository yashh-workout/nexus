
import React, { useState } from 'react';
import { Priority } from '../types';
import { PlusIcon } from './Icons';

interface SmartInputProps {
  onTaskCreate: (title: string, priority: Priority, tags: string[], link?: string) => void;
}

const SmartInput: React.FC<SmartInputProps> = ({ onTaskCreate }) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const parseInput = (text: string) => {
    let title = text;
    let priority = Priority.MEDIUM;
    let tags: string[] = [];
    let link: string | undefined = undefined;

    // Detect URL
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      link = urlMatch[0];
      title = title.replace(link, '').trim();
    }

    // Detect Priority
    const priorityMatch = text.match(/!(urgent|high|medium|low)/i);
    if (priorityMatch) {
      const p = priorityMatch[1].toLowerCase();
      if (p === 'urgent') priority = Priority.URGENT;
      else if (p === 'high') priority = Priority.HIGH;
      else if (p === 'medium') priority = Priority.MEDIUM;
      else if (p === 'low') priority = Priority.LOW;
      
      title = title.replace(priorityMatch[0], '').trim();
    }

    // Detect Tags
    const tagMatches = text.match(/#(\w+)/g);
    if (tagMatches) {
      tags = tagMatches.map(t => t.substring(1));
      tagMatches.forEach(t => {
        title = title.replace(t, '');
      });
      title = title.trim();
    }

    return { title, priority, tags, link };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const { title, priority, tags, link } = parseInput(input);
    if (!title) return;

    onTaskCreate(title, priority, tags, link);
    setInput('');
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-12 relative z-20">
      <form onSubmit={handleSubmit} className="relative group">
        {/* Glow Effect */}
        <div className={`absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 rounded-2xl opacity-0 transition duration-500 group-hover:opacity-50 blur-lg ${isFocused ? 'opacity-70' : ''}`}></div>
        
        <div className="relative flex items-center bg-[#0f172a] rounded-xl border border-white/10 shadow-2xl">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Add a new task... (paste links, #tags, !priority)"
            className="w-full bg-transparent text-white p-5 text-lg placeholder-slate-500 focus:outline-none font-light tracking-wide"
            autoFocus
          />
          <div className="pr-2 flex items-center gap-2">
             <div className="hidden sm:flex gap-2 text-xs text-slate-600 font-mono mr-2">
                <span>!prio</span>
                <span>#tag</span>
             </div>
             <button
                type="submit"
                disabled={!input.trim()}
                className="p-3 rounded-lg bg-white/5 hover:bg-white/10 text-indigo-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <PlusIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SmartInput;
