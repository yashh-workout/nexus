
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Task } from '../types';
import { formatTime } from '../utils';

interface AnalogClockProps {
  tasks: Task[];
  onTimeSelect: (hour: number, minute: number, ampm: 'AM' | 'PM') => void;
  className?: string;
}

// Helper to calculate arc path
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
      return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
      };
    };

    // Cap end angle to avoid full circle glitches if diff is huge, though strictly not needed for <12h tasks
    const effectiveEnd = endAngle - startAngle >= 360 ? startAngle + 359.99 : endAngle;

    const start = polarToCartesian(x, y, radius, effectiveEnd);
    const end = polarToCartesian(x, y, radius, startAngle);

    const largeArcFlag = effectiveEnd - startAngle <= 180 ? "0" : "1";

    const d = [
        "M", x, y,
        "L", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        "Z"
    ].join(" ");

    return d;
}

const AnalogClock: React.FC<AnalogClockProps> = ({ tasks, onTimeSelect, className = "" }) => {
  const [now, setNow] = useState(new Date());
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours() % 12;

  const secondAngle = (seconds / 60) * 360;
  const minuteAngle = ((minutes + seconds / 60) / 60) * 360;
  const hourAngle = ((hours + minutes / 60) / 12) * 360;

  // Calculate task visual markers and arcs
  const taskVisuals = useMemo(() => {
    return tasks
      .filter(t => t.dueDate && !t.completedAt) 
      .map(t => {
        const date = new Date(t.dueDate!);
        const h = date.getHours() % 12;
        const m = date.getMinutes();
        
        const startAngle = ((h + m / 60) / 12) * 360;
        
        let arcPath = undefined;
        if (t.duration) {
             const endAngle = startAngle + (t.duration / 60 / 12) * 360; // 12 hours = 360 degrees
             arcPath = describeArc(50, 50, 42, startAngle, endAngle);
        }

        return { ...t, startAngle, arcPath, rawDate: date };
      });
  }, [tasks]);

  // Logic to determine what to show in the info cards
  const { mainDisplayTask, secondaryDisplayTask, isMainActive } = useMemo(() => {
    const nowMs = now.getTime();
    const sorted = [...tasks]
      .filter(t => t.dueDate && !t.completedAt)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

    // 1. Is there a task currently happening?
    const active = sorted.find(t => {
        const start = new Date(t.dueDate!).getTime();
        const duration = t.duration || 0;
        const end = start + (duration * 60000);
        return nowMs >= start && nowMs < end;
    });

    // 2. Find the next strictly future task
    const upcomingIndex = sorted.findIndex(t => new Date(t.dueDate!).getTime() > nowMs);
    const upcoming = upcomingIndex !== -1 ? sorted[upcomingIndex] : null;

    if (active) {
        return {
            mainDisplayTask: active,
            secondaryDisplayTask: upcoming,
            isMainActive: true
        };
    } else {
        // Gap or Idle: Show upcoming as main
        const subsequent = (upcomingIndex !== -1 && upcomingIndex + 1 < sorted.length)
            ? sorted[upcomingIndex + 1]
            : null;
        
        return {
            mainDisplayTask: upcoming,
            secondaryDisplayTask: subsequent,
            isMainActive: false
        };
    }
  }, [tasks, now]);

  const handleClockClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const x = e.clientX - rect.left - cx;
    const y = e.clientY - rect.top - cy;

    let angleRad = Math.atan2(y, x);
    let angleDeg = angleRad * (180 / Math.PI);
    
    angleDeg += 90;
    if (angleDeg < 0) angleDeg += 360;

    const rawHours = (angleDeg / 360) * 12;
    const selectedHour = Math.floor(rawHours);
    const selectedMinute = Math.floor((rawHours - selectedHour) * 60);

    const snappedMinute = Math.round(selectedMinute / 5) * 5;
    
    // Normalized hour 1-12. 
    // If selectedHour is 0, it means 12.
    const finalHour = selectedHour === 0 ? 12 : selectedHour;
    const finalMinute = snappedMinute === 60 ? 0 : snappedMinute;

    // Auto-detect AM/PM based on "next available time" logic
    const today = new Date();
    
    // Construct Date for AM Candidate
    const dateAM = new Date(today);
    dateAM.setHours(finalHour === 12 ? 0 : finalHour, finalMinute, 0, 0);
    
    // Construct Date for PM Candidate
    const datePM = new Date(today);
    datePM.setHours(finalHour === 12 ? 12 : finalHour + 12, finalMinute, 0, 0);
    
    let ampm: 'AM' | 'PM' = 'AM';
    
    if (dateAM > today) {
        // AM is in the future, prefer it (e.g. It's 9am, I click 11am)
        ampm = 'AM';
    } else if (datePM > today) {
        // AM is past, PM is future, prefer PM (e.g. It's 9am, I click 2pm)
        ampm = 'PM';
    } else {
        // Both are past (e.g. It's 10pm, I click 8pm). Default to AM (implying tomorrow) or just AM default.
        // We default to AM.
        ampm = 'AM';
    }
    
    onTimeSelect(finalHour, finalMinute, ampm);
  };

  const getRelativeTime = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - now.getTime();
    const diffMins = Math.round(diff / 60000);
    
    if (diffMins < 0) return `${Math.abs(diffMins)}m ago`;
    if (diffMins === 0) return 'Now';
    if (diffMins < 60) return `in ${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `in ${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  };
  
  const getEndTime = (dateStr: string, duration?: number) => {
      if (!duration) return '';
      const start = new Date(dateStr);
      const end = new Date(start.getTime() + duration * 60000);
      return formatTime(end.getTime());
  };

  const ticks = Array.from({ length: 60 }, (_, i) => {
    const angle = i * 6;
    const isMajor = i % 5 === 0;
    return (
      <line
        key={i}
        x1="50"
        y1={isMajor ? "12" : "13.5"}
        x2="50"
        y2="15" 
        stroke="currentColor"
        strokeWidth={isMajor ? "0.8" : "0.4"}
        strokeLinecap="round"
        className={isMajor ? "text-slate-400" : "text-slate-700"}
        transform={`rotate(${angle} 50 50)`}
      />
    );
  });

  return (
    <div className={`flex flex-col items-center w-full ${className}`}>
        {/* The Clock Face */}
        <div className="relative group cursor-pointer w-full max-w-[400px] aspect-square mb-12">
            <svg 
                ref={svgRef}
                viewBox="0 0 100 100" 
                className="w-full h-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.7)]"
                onClick={handleClockClick}
            >
                <defs>
                   <linearGradient id="metal-rim" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#334155" />
                        <stop offset="50%" stopColor="#64748b" />
                        <stop offset="100%" stopColor="#1e293b" />
                   </linearGradient>
                   
                   <radialGradient id="clock-face" cx="50%" cy="50%" r="50%">
                        <stop offset="70%" stopColor="#0f172a" />
                        <stop offset="100%" stopColor="#020617" />
                   </radialGradient>
                   
                   <filter id="glow">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>

                <circle cx="50" cy="50" r="49" fill="url(#metal-rim)" />
                <circle cx="50" cy="50" r="47" fill="url(#clock-face)" stroke="#1e293b" strokeWidth="0.5" />

                {/* Render Task Duration Arcs (Slots) */}
                {taskVisuals.map((t) => (
                    t.arcPath && (
                        <path 
                            key={`arc-${t.id}`}
                            d={t.arcPath}
                            fill={t.color || '#6366f1'} 
                            fillOpacity="0.2"
                            className="transition-all duration-300"
                        />
                    )
                ))}

                {ticks}

                {/* Markers */}
                {taskVisuals.map((t) => (
                    <g key={t.id} transform={`rotate(${t.startAngle} 50 50)`} 
                       onMouseEnter={() => setHoveredTask(t.title)}
                       onMouseLeave={() => setHoveredTask(null)}
                    >
                        <circle cx="50" cy="8" r="2.5" fill={t.color || '#818cf8'} filter="url(#glow)" className="transition-all hover:r-4 stroke-slate-900 stroke-[0.5]" />
                    </g>
                ))}

                <line x1="50" y1="50" x2="50" y2="28" stroke="white" strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${hourAngle} 50 50)`} />
                <line x1="50" y1="50" x2="50" y2="20" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" transform={`rotate(${minuteAngle} 50 50)`} />
                <line x1="50" y1="56" x2="50" y2="15" stroke="#6366f1" strokeWidth="0.5" strokeLinecap="round" transform={`rotate(${secondAngle} 50 50)`} />

                <circle cx="50" cy="50" r="2" fill="#6366f1" />
                <circle cx="50" cy="50" r="0.8" fill="#000" />
            </svg>

            {/* Hover Tooltip */}
            {hoveredTask && (
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/90 backdrop-blur-md text-white text-sm px-3 py-2 rounded-xl shadow-2xl border border-white/10 pointer-events-none whitespace-nowrap z-30">
                     {hoveredTask}
                 </div>
            )}
        </div>

        {/* Task Info Deck */}
        <div className="w-full max-w-lg space-y-4 px-4">
            
            {/* Main Card (Active or Up Next) */}
            {mainDisplayTask ? (
                <div 
                  className={`relative overflow-hidden group rounded-2xl border p-5 transition-all backdrop-blur-md ${
                      isMainActive 
                        ? 'bg-opacity-10 hover:bg-opacity-20' 
                        : 'bg-slate-800/40 hover:bg-slate-800/60 border-white/5'
                  }`}
                  style={isMainActive ? {
                      backgroundColor: `${mainDisplayTask.color || '#6366f1'}1A`, 
                      borderColor: `${mainDisplayTask.color || '#6366f1'}4D` 
                  } : {}}
                >
                    {isMainActive && (
                        <div 
                            className="absolute left-0 top-0 bottom-0 w-1.5"
                            style={{ backgroundColor: mainDisplayTask.color || '#6366f1' }}
                        ></div>
                    )}
                    
                    <div className="flex justify-between items-center mb-2">
                        <span 
                            className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${isMainActive ? '' : 'text-slate-500'}`}
                            style={isMainActive ? { color: mainDisplayTask.color || '#818cf8' } : {}}
                        >
                            {isMainActive ? (
                                <>
                                    <span 
                                        className="w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_currentColor]"
                                        style={{ backgroundColor: mainDisplayTask.color || '#6366f1' }}
                                    ></span>
                                    Current Focus
                                </>
                            ) : (
                                "Up Next"
                            )}
                        </span>
                        <div className="flex items-center gap-2">
                            <span 
                                className={`text-xs font-mono text-opacity-80 px-2 py-0.5 rounded ${isMainActive ? '' : 'bg-white/5 text-slate-400'}`}
                                style={isMainActive ? { 
                                    backgroundColor: `${mainDisplayTask.color || '#6366f1'}1A`,
                                    color: mainDisplayTask.color ? '#e2e8f0' : '#a5b4fc'
                                } : {}}
                            >
                                {isMainActive 
                                    ? `Ends at ${getEndTime(mainDisplayTask.dueDate!, mainDisplayTask.duration)}`
                                    : getRelativeTime(mainDisplayTask.dueDate!)
                                }
                            </span>
                        </div>
                    </div>
                    <h3 className={`text-xl font-medium leading-tight ${isMainActive ? 'text-white' : 'text-slate-200'}`}>
                        {mainDisplayTask.title}
                    </h3>
                </div>
            ) : (
                <div className="text-center p-6 border border-dashed border-slate-700/50 rounded-2xl">
                    <p className="text-slate-400 text-sm">Time Machine idle.</p>
                    <p className="text-slate-600 text-xs mt-1">Tap the clock face to schedule a task.</p>
                </div>
            )}

            {/* Secondary Card (Subsequent Task) */}
            {secondaryDisplayTask && (
                <div className="relative rounded-2xl bg-slate-800/40 border border-white/5 p-5 flex items-center justify-between transition-all hover:bg-slate-800/60 hover:border-white/10 backdrop-blur-md opacity-80 hover:opacity-100">
                    <div className="flex-grow min-w-0 pr-4">
                         <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                            {isMainActive ? "Up Next" : "Later"}
                        </span>
                        <h3 className="text-base font-medium text-slate-300 truncate">{secondaryDisplayTask.title}</h3>
                    </div>
                    <div className="text-right flex-shrink-0 flex flex-col items-end">
                        <span 
                            className="block text-sm font-bold text-white bg-white/5 px-2 py-1 rounded mb-1"
                            style={{ color: secondaryDisplayTask.color || 'white' }}
                        >
                            {formatTime(new Date(secondaryDisplayTask.dueDate!).getTime())}
                        </span>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default AnalogClock;
