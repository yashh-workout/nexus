
import React, { useState, useEffect, useRef } from 'react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialHour: number;
  initialMinute: number;
  initialAmpm: 'AM' | 'PM';
  onConfirm: (title: string, hour: number, minute: number, ampm: 'AM' | 'PM', duration: number) => void;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, initialHour, initialMinute, initialAmpm, onConfirm }) => {
  const [title, setTitle] = useState('');
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(initialAmpm);
  const [duration, setDuration] = useState(30); 
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setHour(initialHour);
      setMinute(initialMinute);
      setAmpm(initialAmpm);
      setTitle('');
      setDuration(30);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialHour, initialMinute, initialAmpm]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onConfirm(title, hour, minute, ampm, duration);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] rounded-3xl shadow-2xl border border-white/10 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-white/5 bg-white/5">
          <h3 className="text-lg font-semibold text-white">Schedule Task</h3>
          <p className="text-sm text-slate-400">Set time and duration.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex gap-4">
             <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Start Time</label>
                <div className="flex items-center gap-1">
                   <div className="flex bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                       <input 
                         type="number" 
                         min="1" max="12" 
                         value={hour}
                         onChange={(e) => setHour(Number(e.target.value))}
                         className="w-12 bg-transparent p-2 text-center text-white text-lg font-mono focus:outline-none"
                       />
                       <span className="text-slate-500 font-bold text-lg py-2">:</span>
                       <input 
                         type="number" 
                         min="0" max="59" 
                         value={minute.toString().padStart(2, '0')}
                         onChange={(e) => setMinute(Number(e.target.value))}
                         className="w-12 bg-transparent p-2 text-center text-white text-lg font-mono focus:outline-none"
                       />
                   </div>
                   <div className="flex flex-col gap-1 ml-1">
                     <button 
                       type="button"
                       onClick={() => setAmpm('AM')}
                       className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${ampm === 'AM' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                     >AM</button>
                     <button 
                       type="button"
                       onClick={() => setAmpm('PM')}
                       className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${ampm === 'PM' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                     >PM</button>
                   </div>
                </div>
             </div>

             <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Duration (min)</label>
                <div className="flex bg-slate-900 border border-slate-700 rounded-xl overflow-hidden items-center h-[52px]">
                   <input 
                     type="number" 
                     min="1" 
                     max="720"
                     value={duration}
                     onChange={(e) => setDuration(Number(e.target.value))}
                     className="w-full bg-transparent p-2 text-center text-white text-lg font-mono focus:outline-none"
                   />
                   <span className="text-slate-500 text-xs pr-4 font-medium">min</span>
                </div>
             </div>
          </div>

          <div>
             <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Task Title</label>
             <input 
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs doing?"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
             />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleModal;
