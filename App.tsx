
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import SmartInput from './components/SmartInput';
import TaskItem from './components/TaskItem';
import Sidebar from './components/Sidebar';
import ScheduleModal from './components/ScheduleModal';
import AnalogClock from './components/AnalogClock';
import DailyNote from './components/DailyNote';
import { Task, TaskStatus, Priority } from './types';
import { generateId } from './utils';
import { CheckCircleIcon, ArrowLeftIcon, ArrowRightIcon, BoltIcon, FilterIcon } from './components/Icons';

// Palette for clock slots
const SLOT_COLORS = [
  '#818cf8', // Indigo
  '#f472b6', // Pink
  '#34d399', // Emerald
  '#fbbf24', // Amber
  '#38bdf8', // Sky
  '#a78bfa', // Violet
];

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('nexus-tasks');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((t: any) => ({ ...t, column: t.column || 'today' }));
    }
    return [];
  });

  const [dailyNote, setDailyNote] = useState<{text: string, keep: boolean}>(() => {
    const saved = localStorage.getItem('nexus-daily-note');
    const today = new Date().toISOString().split('T')[0];
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date !== today) {
            if (parsed.keep) {
                return { text: parsed.text, keep: false };
            } else {
                return { text: '', keep: false };
            }
        }
        return { text: parsed.text || '', keep: !!parsed.keep };
    }
    return { text: '', keep: false };
  });
  
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('dashboard');
  const [now, setNow] = useState(new Date());
  
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleTime, setScheduleTime] = useState<{ hour: number, minute: number, ampm: 'AM'|'PM' }>({ hour: 12, minute: 0, ampm: 'AM' });

  // Drag and Drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Initialization Effect: Migrate legacy tasks to have order
  useEffect(() => {
    setTasks(prev => {
        const needsMigration = prev.some(t => typeof t.order !== 'number');
        if (!needsMigration) return prev;

        // Sort by legacy rules (Time > Priority > Created)
        const sorted = [...prev].sort((a, b) => {
            if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;
            const priorityOrder = { [Priority.URGENT]: 0, [Priority.HIGH]: 1, [Priority.MEDIUM]: 2, [Priority.LOW]: 3 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) return priorityOrder[a.priority] - priorityOrder[b.priority];
            return b.createdAt - a.createdAt;
        });

        return sorted.map((t, index) => ({ ...t, order: index * 10000 }));
    });
  }, []);

  useEffect(() => {
    const checkDateTransition = () => {
      const lastVisit = localStorage.getItem('nexus-last-visit');
      const today = new Date().toISOString().split('T')[0];

      if (lastVisit && lastVisit !== today) {
        setTasks(prev => prev.map(t => {
          if (t.column === 'tomorrow') {
            return { ...t, column: 'today' };
          }
          return t;
        }));

        setDailyNote(prev => {
             if (prev.keep) return { ...prev, keep: false };
             return { text: '', keep: false };
        });
      }
      
      localStorage.setItem('nexus-last-visit', today);
    };

    checkDateTransition();
  }, []);

  useEffect(() => {
    localStorage.setItem('nexus-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('nexus-daily-note', JSON.stringify({
        ...dailyNote,
        date: today
    }));
  }, [dailyNote]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Helper to get max order
  const getMaxOrder = () => {
      if (tasks.length === 0) return 0;
      return Math.max(...tasks.map(t => t.order || 0));
  }

  const handleCreateTask = (title: string, priority: Priority, tags: string[], link?: string) => {
    // New tasks without time go to the bottom of the "today" list by default
    const newOrder = getMaxOrder() + 10000;

    const newTask: Task = {
      id: generateId(),
      title: title,
      status: TaskStatus.TODO,
      priority: priority,
      tags: tags,
      subtasks: [],
      createdAt: Date.now(),
      dueDate: undefined,
      column: 'today',
      completedAt: undefined,
      link: link,
      order: newOrder
    };
    setTasks(prev => [...prev, newTask]);
  };

  const handleScheduleConfirm = (title: string, hour: number, minute: number, ampm: 'AM' | 'PM', duration: number) => {
    let h = hour;
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;

    const date = new Date();
    date.setHours(h, minute, 0, 0);

    // Find correct order to maintain time sequence
    // Filter active today tasks, sort by order
    const todayActive = tasks.filter(t => t.column === 'today' && t.status !== TaskStatus.COMPLETED)
                           .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Find insertion point based on time
    let insertIndex = -1;
    const newTime = date.getTime();

    for (let i = 0; i < todayActive.length; i++) {
        const t = todayActive[i];
        if (t.dueDate) {
            const tTime = new Date(t.dueDate).getTime();
            if (newTime < tTime) {
                insertIndex = i;
                break;
            }
        } else {
            // If we hit non-timed tasks, insert here (time takes precedence over non-time)
            insertIndex = i;
            break;
        }
    }

    let newOrder;
    if (insertIndex === -1) {
        // Append to end
        newOrder = getMaxOrder() + 10000;
    } else {
        // Insert at index
        const prevOrder = insertIndex > 0 ? todayActive[insertIndex - 1].order : (todayActive[0].order - 10000);
        const nextOrder = todayActive[insertIndex].order;
        newOrder = (prevOrder + nextOrder) / 2;
    }

    const randomColor = SLOT_COLORS[Math.floor(Math.random() * SLOT_COLORS.length)];

    const newTask: Task = {
      id: generateId(),
      title: title,
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      tags: [],
      subtasks: [],
      createdAt: Date.now(),
      dueDate: date.toISOString(),
      duration: duration,
      column: 'today',
      completedAt: undefined,
      color: randomColor,
      order: newOrder
    };

    setTasks(prev => [...prev, newTask]);
  };

  const openScheduleModal = (hour: number, minute: number, ampm: 'AM' | 'PM') => {
    setScheduleTime({ hour, minute, ampm });
    setIsScheduleModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleDuplicate = (id: string) => {
    const taskToDuplicate = tasks.find(t => t.id === id);
    if (!taskToDuplicate) return;

    const newTask: Task = {
      ...taskToDuplicate,
      id: generateId(),
      createdAt: Date.now(),
      status: TaskStatus.TODO,
      completedAt: undefined,
      subtasks: taskToDuplicate.subtasks.map(s => ({...s, id: generateId(), isCompleted: false})),
      order: taskToDuplicate.order + 100 // Insert right after
    };
    setTasks(prev => [...prev, newTask]);
  };

  const handleCopyAllToTomorrow = () => {
    const tasksToCopy = tasks.filter(t => t.column === 'today');
    if (tasksToCopy.length === 0) return;

    const newTasks: Task[] = tasksToCopy.map(t => {
       let newDueDate = undefined;
       if (t.dueDate) {
           const d = new Date(t.dueDate);
           d.setDate(d.getDate() + 1);
           newDueDate = d.toISOString();
       }

       return {
            ...t,
            id: generateId(),
            createdAt: Date.now(),
            status: TaskStatus.TODO,
            completedAt: undefined,
            column: 'tomorrow',
            dueDate: newDueDate,
            subtasks: t.subtasks.map(s => ({...s, id: generateId(), isCompleted: false}))
       };
    });

    setTasks(prev => [...prev, ...newTasks]);
  };

  const handleMoveTomorrowToToday = () => {
    if (window.confirm("Move all 'Tomorrow' tasks to 'Today'?")) {
      setTasks(prev => prev.map(t => {
        if (t.column === 'tomorrow') {
          return { ...t, column: 'today' };
        }
        return t;
      }));
    }
  };

  const handleToggleStatus = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const isNowCompleted = t.status !== TaskStatus.COMPLETED;
      return {
        ...t,
        status: isNowCompleted ? TaskStatus.COMPLETED : TaskStatus.TODO,
        completedAt: isNowCompleted ? Date.now() : undefined
      };
    }));
  };

  const handleAddSubtasks = (taskId: string, steps: string[]) => {
    const newSubtasks = steps.map(step => ({
      id: generateId(),
      title: step,
      isCompleted: false
    }));

    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: [...t.subtasks, ...newSubtasks]
      };
    }));
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: t.subtasks.map(s => 
          s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
        )
      };
    }));
  };

  const handleUpdateLink = (taskId: string, link: string) => {
      setTasks(prev => prev.map(t => {
          if (t.id !== taskId) return t;
          return { ...t, link: link.trim() };
      }));
  };

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggedTaskId(id);
      e.dataTransfer.effectAllowed = 'move';
      // Set invisible ghost image or default
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      if (!draggedTaskId || draggedTaskId === targetId) {
          setDraggedTaskId(null);
          return;
      }

      setTasks(prev => {
          const allTasks = [...prev];
          const draggedTask = allTasks.find(t => t.id === draggedTaskId);
          const targetTask = allTasks.find(t => t.id === targetId);

          if (!draggedTask || !targetTask) return prev;
          
          // Guard: Only allow reordering within the same visual list (Column + Status)
          if (draggedTask.column !== targetTask.column || draggedTask.status !== targetTask.status) {
              return prev;
          }

          // Get the relevant list sorted by current order
          const listContext = allTasks
              .filter(t => t.column === draggedTask.column && t.status === draggedTask.status)
              .sort((a, b) => (a.order || 0) - (b.order || 0));

          const curIndex = listContext.findIndex(t => t.id === draggedTaskId);
          const targetIndex = listContext.findIndex(t => t.id === targetId);

          if (curIndex === -1 || targetIndex === -1) return prev;

          // Remove from old position and insert at new position
          const reorderedList = [...listContext];
          const [removed] = reorderedList.splice(curIndex, 1);
          reorderedList.splice(targetIndex, 0, removed);

          // Re-assign orders with large spacing to ensure clean slate
          const updates = new Map();
          reorderedList.forEach((t, index) => {
              updates.set(t.id, (index + 1) * 10000);
          });

          // Apply updates to the main task state
          return allTasks.map(t => {
              if (updates.has(t.id)) {
                  return { ...t, order: updates.get(t.id) };
              }
              return t;
          });
      });

      setDraggedTaskId(null);
  };

  const relevantTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filter.startsWith('tag:')) {
        const tag = filter.replace('tag:', '');
        return task.tags.includes(tag);
      }
      return true;
    });
  }, [tasks, filter]);

  const activeTaskId = useMemo(() => {
    const nowMs = now.getTime();
    return tasks.find(t => {
       if (t.status === TaskStatus.COMPLETED) return false;
       if (!t.dueDate) return false;
       const start = new Date(t.dueDate).getTime();
       const duration = t.duration || 30;
       const end = start + (duration * 60000);
       return nowMs >= start && nowMs < end;
    })?.id;
  }, [tasks, now]);

  const todayTasks = useMemo(() => relevantTasks.filter(t => t.column === 'today'), [relevantTasks]);
  const tomorrowTasks = useMemo(() => relevantTasks.filter(t => t.column === 'tomorrow'), [relevantTasks]);

  const sortColumn = (taskList: Task[]) => {
    // Active tasks: Sort strictly by Order
    const active = taskList
      .filter(t => t.status !== TaskStatus.COMPLETED)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Completed tasks: Sort by completion time (reverse chronological)
    const completed = taskList
      .filter(t => t.status === TaskStatus.COMPLETED)
      .sort((a, b) => (b.completedAt || b.createdAt) - (a.completedAt || a.createdAt));

    return { active, completed };
  };

  const todaySorted = sortColumn(todayTasks);
  const tomorrowSorted = sortColumn(tomorrowTasks);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const todayDateDisplay = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDateDisplay = tomorrow.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const tasksLeft = todayTasks.filter(t => t.status !== TaskStatus.COMPLETED).length;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-900/10 rounded-full blur-[120px]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#020617]/70 backdrop-blur-xl supports-[backdrop-filter]:bg-[#020617]/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setView('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <CheckCircleIcon className="w-6 h-6 text-white" filled />
            </div>
            <h1 className="hidden sm:block text-2xl font-bold tracking-tight text-white">
              Nexus<span className="text-indigo-400">Task</span>
            </h1>
          </div>

          <div className="hidden md:flex items-center bg-white/5 rounded-full p-1 border border-white/5 backdrop-blur-md shadow-inner">
              <button
                onClick={() => setView('dashboard')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${view === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 scale-105' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <FilterIcon className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setView('clock')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${view === 'clock' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 scale-105' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <BoltIcon className="w-4 h-4" />
                <span>Time Machine</span>
              </button>
          </div>

          <div className="flex items-center gap-4">
             <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-sm text-slate-300 font-medium whitespace-nowrap">
               {tasksLeft} Pending
             </div>
          </div>
        </div>

        <div className="md:hidden px-6 pb-4 border-b border-white/5">
            <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/5 shadow-inner">
                <button
                    onClick={() => setView('dashboard')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${view === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-white'}`}
                >
                    <FilterIcon className="w-4 h-4" />
                    <span>Dashboard</span>
                </button>
                <button
                    onClick={() => setView('clock')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${view === 'clock' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-white'}`}
                >
                    <BoltIcon className="w-4 h-4" />
                    <span>Time Machine</span>
                </button>
            </div>
        </div>
      </header>

      <main className="flex-grow relative z-10 max-w-7xl mx-auto w-full px-6 pt-10 pb-20 flex gap-10">
        
        <Sidebar 
            activeFilter={filter} 
            onFilterChange={setFilter} 
            currentView={view}
            onViewChange={setView}
            tags={useMemo(() => {
                const tags = new Set<string>();
                tasks.forEach(t => t.tags.forEach(tag => tags.add(tag)));
                return Array.from(tags).sort();
            }, [tasks])} 
        />

        {view === 'dashboard' ? (
        <div className="flex-grow min-w-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8">
             <h2 className="text-4xl font-light text-white mb-2 tracking-tight">
               {getGreeting()}.
             </h2>
             <p className="text-slate-400 text-lg font-light">Focus on what matters.</p>
          </div>

          <DailyNote 
            note={dailyNote.text} 
            setNote={(text) => setDailyNote(prev => ({...prev, text}))} 
            isKeepEnabled={dailyNote.keep}
            onToggleKeep={() => setDailyNote(prev => ({...prev, keep: !prev.keep}))}
          />

          <SmartInput onTaskCreate={handleCreateTask} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* COLUMN 1: TODAY */}
            <div className="rounded-3xl p-1">
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    Today <span className="text-slate-500 font-normal text-base ml-1">{todayDateDisplay}</span>
                    </h3>
                </div>
                <button
                    onClick={handleCopyAllToTomorrow}
                    disabled={todayTasks.length === 0}
                    className="group flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <span>Clone to Tomorrow</span>
                    <div className="p-1 rounded-full bg-slate-800 group-hover:bg-indigo-500/20 transition-colors">
                        <ArrowRightIcon className="w-3 h-3" />
                    </div>
                </button>
              </div>

              <div className="space-y-4 min-h-[200px]">
                {todaySorted.active.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    isActive={task.id === activeTaskId}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onAddSubtasks={handleAddSubtasks}
                    onToggleSubtask={handleToggleSubtask}
                    onUpdateLink={handleUpdateLink}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  />
                ))}
                
                {todaySorted.active.length === 0 && todaySorted.completed.length === 0 && (
                   <div className="flex flex-col items-center justify-center py-16 text-slate-600 border border-dashed border-slate-800 rounded-2xl bg-white/[0.02]">
                     <p className="text-sm font-medium">All clear for today.</p>
                   </div>
                )}
              </div>

              {/* Completed Today */}
              {todaySorted.completed.length > 0 && (
                <div className="mt-10 pt-6 border-t border-white/5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Completed</h4>
                  <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity duration-300">
                    {todaySorted.completed.map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggleStatus={handleToggleStatus}
                        onDelete={handleDelete}
                        onDuplicate={handleDuplicate}
                        onAddSubtasks={handleAddSubtasks}
                        onToggleSubtask={handleToggleSubtask}
                        onUpdateLink={handleUpdateLink}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* COLUMN 2: TOMORROW */}
            <div className="rounded-3xl p-1">
              <div className="flex items-center justify-between mb-6 px-2">
                <h3 className="text-xl font-semibold text-slate-300 flex items-center gap-2">
                   Tomorrow <span className="text-slate-600 font-normal text-base ml-1">{tomorrowDateDisplay}</span>
                </h3>
                {tomorrowTasks.length > 0 && (
                   <button 
                     onClick={handleMoveTomorrowToToday}
                     className="group flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors"
                   >
                     <div className="p-1 rounded-full bg-slate-800 group-hover:bg-indigo-500/20 transition-colors">
                        <ArrowLeftIcon className="w-3 h-3" />
                     </div>
                     <span>Start Day Now</span>
                   </button>
                )}
              </div>

              <div className="space-y-4 min-h-[200px]">
                {tomorrowSorted.active.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    isLocked={true}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onAddSubtasks={handleAddSubtasks}
                    onToggleSubtask={handleToggleSubtask}
                    onUpdateLink={handleUpdateLink}
                  />
                ))}

                {tomorrowSorted.active.length === 0 && tomorrowSorted.completed.length === 0 && (
                   <div className="flex flex-col items-center justify-center py-16 text-slate-700 border border-dashed border-slate-800/50 rounded-2xl">
                     <p className="text-sm font-medium italic">Empty.</p>
                   </div>
                )}
              </div>

              {tomorrowSorted.completed.length > 0 && (
                <div className="mt-10 pt-6 border-t border-white/5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Completed</h4>
                  <div className="space-y-3 opacity-60">
                    {tomorrowSorted.completed.map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggleStatus={handleToggleStatus}
                        onDelete={handleDelete}
                        onDuplicate={handleDuplicate}
                        onAddSubtasks={handleAddSubtasks}
                        onToggleSubtask={handleToggleSubtask}
                        onUpdateLink={handleUpdateLink}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
        ) : (
            <div className="flex-grow min-w-0 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-20 animate-in fade-in zoom-in-95 duration-500">
                 <div className="relative w-full max-w-xl">
                    <div className="absolute inset-0 bg-indigo-500/10 blur-[120px] rounded-full animate-pulse z-0"></div>
                    <AnalogClock 
                        tasks={todayTasks} 
                        onTimeSelect={openScheduleModal} 
                        className="w-full relative z-10" 
                    />
                 </div>
            </div>
        )}

        <ScheduleModal 
            isOpen={isScheduleModalOpen}
            onClose={() => setIsScheduleModalOpen(false)}
            initialHour={scheduleTime.hour}
            initialMinute={scheduleTime.minute}
            initialAmpm={scheduleTime.ampm}
            onConfirm={handleScheduleConfirm}
        />
      </main>
    </div>
  );
};

export default App;
