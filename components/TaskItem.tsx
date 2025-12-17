
import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskStatus } from '../types';
import { TrashIcon, CalendarIcon, ChevronRightIcon, PlusIcon, DuplicateIcon, LockIcon, CheckIcon, LinkIcon, ExternalLinkIcon, DragHandleIcon } from './Icons';
import { formatDate, formatTime, getPriorityColor } from '../utils';

interface TaskItemProps {
  task: Task;
  isActive?: boolean;
  isLocked?: boolean;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAddSubtasks: (id: string, subtasks: string[]) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onUpdateLink: (taskId: string, link: string) => void;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetId: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  isActive, 
  isLocked, 
  onToggleStatus, 
  onDelete, 
  onDuplicate, 
  onAddSubtasks, 
  onToggleSubtask,
  onUpdateLink,
  onDragStart,
  onDragOver,
  onDrop
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  const isCompleted = task.status === TaskStatus.COMPLETED;

  useEffect(() => {
    if (isAddingSubtask && subtaskInputRef.current) {
      subtaskInputRef.current.focus();
    }
  }, [isAddingSubtask]);

  const handleAddSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtaskTitle.trim()) {
      onAddSubtasks(task.id, [newSubtaskTitle.trim()]);
      setNewSubtaskTitle('');
      setIsAddingSubtask(false); 
    }
  };

  const activeColor = task.color || '#818cf8'; // Default indigo if no color set

  const activeStyle = isActive ? {
      borderColor: activeColor,
      backgroundColor: `${activeColor}15`, // 15% opacity
      boxShadow: `0 0 25px -5px ${activeColor}30` // Glow effect
  } : {};

  const handleMainClick = () => {
    if (isLocked) return;
    onToggleStatus(task.id);
  };

  return (
    <div 
      className={`group relative bg-slate-800/40 backdrop-blur-md border rounded-2xl transition-all duration-300 ease-out 
      ${isExpanded ? 'shadow-2xl shadow-black/50 bg-slate-800/60' : isActive ? '' : 'shadow-sm hover:shadow-lg hover:-translate-y-0.5'}
      ${isCompleted 
        ? 'border-transparent bg-slate-900/20' 
        : isActive 
            ? 'z-10' // Lift active task
            : 'border-white/5 hover:border-indigo-500/30'
      }`}
      style={!isCompleted ? activeStyle : undefined}
      draggable={!isLocked && !isCompleted && !!onDragStart}
      onDragStart={(e) => onDragStart && onDragStart(e, task.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop && onDrop(e, task.id)}
    >
      <style>
        {`
          @keyframes popIn {
            0% { transform: scale(0); opacity: 0; }
            70% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
          }
          .animate-pop-in {
            animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
        `}
      </style>
      
      {/* Active Task Badge */}
      {isActive && !isCompleted && (
         <div className="absolute -top-3 left-6 z-20">
            <span 
                className="bg-[#020617] px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm" 
                style={{ borderColor: activeColor, color: activeColor }}
            >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-current"></span>
                Current Focus
            </span>
         </div>
      )}

      {/* Selection Indicator Line */}
      {!isCompleted && !isActive && !isLocked && <div className="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"></div>}
      
      {/* Active Indicator Line */}
      {isActive && !isCompleted && <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl" style={{ backgroundColor: activeColor }}></div>}

      <div 
        className={`p-5 flex items-start gap-4 select-none ${isLocked ? 'cursor-default' : 'cursor-pointer'}`}
        onClick={handleMainClick}
      >
        {/* Drag Handle */}
        {!isLocked && !isCompleted && (
           <div 
             className="mt-1 cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 transition-colors"
             onMouseDown={(e) => e.stopPropagation()} // Prevent triggering main click
           >
              <DragHandleIcon className="w-5 h-5" />
           </div>
        )}

        {/* Custom Checkbox */}
        <div 
            className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300
            ${isLocked 
                ? 'border-slate-700 bg-slate-800/50 cursor-not-allowed opacity-60 border-dashed'
                : isCompleted 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                    : 'bg-transparent'
            }
            `}
            style={isActive && !isCompleted && !isLocked ? { borderColor: activeColor } : isCompleted ? {} : isLocked ? {} : { borderColor: 'rgba(71, 85, 105, 1)' }}
        >
            {isCompleted && <CheckIcon className="w-3.5 h-3.5 text-emerald-400 animate-pop-in" strokeWidth={3} />}
            {isLocked && <LockIcon className="w-2.5 h-2.5 text-slate-500" />}
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-3">
            <h3 
              className={`text-base font-medium leading-tight transition-all duration-300 ${isCompleted ? 'text-slate-500' : isActive ? 'text-white' : isLocked ? 'text-slate-400' : 'text-slate-200 group-hover:text-white'}`}
            >
              <span className="relative inline-block">
                {task.title}
                <span 
                    className={`absolute left-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-slate-500/60 transition-all duration-500 ease-out rounded-full ${isCompleted ? 'w-full opacity-100' : 'w-0 opacity-0'}`}
                ></span>
              </span>
            </h3>
          </div>
          
          <div className={`mt-2 flex flex-wrap items-center gap-3 text-xs`}>
            {/* Priority Tag */}
            {!isCompleted && (
                <span className={`px-2 py-0.5 rounded-md border font-medium tracking-wide ${getPriorityColor(task.priority)}`}>
                {task.priority}
                </span>
            )}

            {isCompleted && task.completedAt && (
                <span className="text-emerald-500/70 font-medium animate-in fade-in duration-500">Done {formatTime(task.completedAt)}</span>
            )}

            {task.dueDate ? (
              <div 
                className="flex items-center gap-1.5 transition-colors"
                style={isActive && !isCompleted ? { color: activeColor } : { color: '#94a3b8' }}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>
                    {formatDate(task.dueDate)}
                    {task.duration ? ` • ${task.duration}m` : ''}
                </span>
              </div>
            ) : (
              !isCompleted && (
               <div className="flex items-center gap-1.5 text-slate-500">
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-600/50 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-slate-600/50 rounded-full"></div>
                  </div>
                  <span>Anytime</span>
               </div>
              )
            )}
            
            {task.tags.length > 0 && (
              <div className="flex gap-2">
                {task.tags.map(tag => (
                  <span key={tag} className="text-slate-500">#{tag}</span>
                ))}
              </div>
            )}

            {/* Quick Link Access */}
            {task.link && !isExpanded && (
                <a 
                   href={task.link}
                   target="_blank"
                   rel="noopener noreferrer"
                   onClick={(e) => e.stopPropagation()}
                   className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 hover:underline decoration-indigo-400/50 underline-offset-2 transition-all"
                >
                    <LinkIcon className="w-3 h-3" />
                    <span>Open Link</span>
                </a>
            )}
          </div>
        </div>

        {/* Action Buttons (Visible on Hover/Expanded) */}
        <div className={`flex items-center gap-1 transition-opacity duration-200 ${isExpanded || isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
           <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(task.id);
            }}
            title="Duplicate"
            className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <DuplicateIcon className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            title="Delete"
            className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
            }}
            className={`p-2 rounded-lg transition-transform duration-200 ${isExpanded ? 'rotate-90 text-white' : 'text-slate-500 hover:text-white'}`}
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Details / Subtasks */}
      <div 
        className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pb-5 pl-14 pt-0">
           {task.description && (
             <p className="mb-4 text-sm text-slate-400 leading-relaxed font-light">{task.description}</p>
           )}

           {/* Link Input Field */}
           <div className="mb-6 flex items-center gap-3">
               <div className="p-2 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <LinkIcon className="w-4 h-4 text-slate-400" />
               </div>
               <div className="flex-grow relative">
                  <input 
                    type="text" 
                    placeholder="Attach a link (e.g., https://google.com)" 
                    defaultValue={task.link || ''}
                    onBlur={(e) => onUpdateLink(task.id, e.target.value)}
                    className="w-full bg-slate-900/30 border-b border-slate-700 focus:border-indigo-500 text-sm text-slate-200 py-1.5 focus:outline-none transition-colors"
                  />
                  {task.link && (
                      <a href={task.link} target="_blank" rel="noreferrer" className="absolute right-0 top-1.5 text-slate-500 hover:text-indigo-400">
                          <ExternalLinkIcon className="w-4 h-4" />
                      </a>
                  )}
               </div>
           </div>

           <div className="space-y-2">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                 Subtasks
               </span>
             </div>
             
             <ul className="space-y-1">
               {task.subtasks.map(sub => (
                 <li key={sub.id} className="flex items-center gap-3 group/sub py-1">
                   <button
                    disabled={isLocked}
                    onClick={() => !isLocked && onToggleSubtask(task.id, sub.id)}
                    className={`w-3.5 h-3.5 border rounded-sm flex items-center justify-center transition-all 
                        ${isLocked ? 'border-slate-700 bg-slate-800/50 cursor-not-allowed opacity-50' : sub.isCompleted ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600 hover:border-indigo-400'}`}
                   >
                     {sub.isCompleted && !isLocked && <div className="w-2 h-2 bg-white rounded-[1px]" />}
                   </button>
                   <span className={`text-sm transition-colors ${sub.isCompleted ? 'text-slate-600 line-through' : isLocked ? 'text-slate-500' : 'text-slate-300'}`}>{sub.title}</span>
                 </li>
               ))}
               
               {isAddingSubtask ? (
                 <li className="flex items-center gap-3 animate-in fade-in duration-200 mt-2">
                    <div className="w-3.5 h-3.5 border border-slate-600 rounded-sm opacity-50"></div>
                    <form onSubmit={handleAddSubtaskSubmit} className="flex-grow">
                      <input 
                        ref={subtaskInputRef}
                        type="text" 
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        onBlur={() => !newSubtaskTitle && setIsAddingSubtask(false)}
                        placeholder="Type next step..."
                        className="w-full bg-transparent border-b border-indigo-500/50 px-0 py-1 text-sm text-white focus:outline-none placeholder-slate-600"
                      />
                    </form>
                 </li>
               ) : (
                !isLocked && (
                <li className="mt-2">
                    <button 
                        onClick={() => setIsAddingSubtask(true)}
                        className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                    >
                        <PlusIcon className="w-3 h-3" /> Add Step
                    </button>
                </li>
                )
               )}
             </ul>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
