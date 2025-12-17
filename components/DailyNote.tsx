
import React, { useRef, useEffect } from 'react';
import { LightBulbIcon, RepeatIcon } from './Icons';

interface DailyNoteProps {
  note: string;
  setNote: (note: string) => void;
  isKeepEnabled: boolean;
  onToggleKeep: () => void;
}

const DailyNote: React.FC<DailyNoteProps> = ({ note, setNote, isKeepEnabled, onToggleKeep }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [note]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      // Get current line up to cursor
      const beforeCursor = value.substring(0, start);
      const afterCursor = value.substring(end);
      
      const lastLineIndex = beforeCursor.lastIndexOf('\n');
      const currentLine = beforeCursor.substring(lastLineIndex + 1);

      // Regex for "1. ", "2. ", etc
      const match = currentLine.match(/^(\d+)\.\s/);
      
      if (match) {
        e.preventDefault();
        const number = parseInt(match[1]);
        
        // If line is empty (just the number "3. "), clear it and exit list
        if (currentLine.trim() === `${number}.`) {
            const newBefore = beforeCursor.substring(0, lastLineIndex + 1); // remove the number line
            const newValue = newBefore + afterCursor;
            setNote(newValue);
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = newBefore.length;
            }, 0);
            return;
        }

        const nextNumber = number + 1;
        const insertion = `\n${nextNumber}. `;
        const newValue = beforeCursor + insertion + afterCursor;
        
        setNote(newValue);
        
        setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
        }, 0);
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8 relative group">
       {/* Background Glow */}
      <div className="absolute inset-0 bg-amber-500/5 rounded-2xl blur-xl transition-opacity duration-500 group-hover:bg-amber-500/10"></div>
      
      <div className="relative bg-[#0f172a]/60 backdrop-blur-md border border-amber-500/20 rounded-2xl p-1 shadow-lg overflow-hidden transition-all duration-300 focus-within:shadow-amber-900/20 focus-within:border-amber-500/40">
        <div className="flex items-start gap-4 p-4">
           <div className="mt-1 p-2 rounded-full bg-amber-500/10 text-amber-400">
             <LightBulbIcon className="w-5 h-5" />
           </div>
           
           <div className="flex-grow">
             <label className="block text-[10px] font-bold text-amber-500/70 uppercase tracking-widest mb-2">
                Daily Focus & Reminders
             </label>
             <textarea
                ref={textareaRef}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="1. What is the one thing you must not forget today?"
                className="w-full bg-transparent text-slate-200 placeholder-slate-600 text-base font-medium resize-none focus:outline-none min-h-[40px] leading-relaxed selection:bg-amber-500/30"
                style={{ lineHeight: '1.6' }}
                rows={1}
             />
           </div>
        </div>

        <div className="bg-black/20 border-t border-white/5 px-4 py-2 flex justify-end">
            <button
                onClick={onToggleKeep}
                className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    isKeepEnabled 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
                title="If active, this note will be carried over to tomorrow automatically."
            >
                <RepeatIcon className="w-3.5 h-3.5" />
                <span>{isKeepEnabled ? 'Keep for Tomorrow' : 'Clear Tomorrow'}</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default DailyNote;
