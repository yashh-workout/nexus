
import React from 'react';
import { FilterIcon, CalendarIcon, CheckCircleIcon, BoltIcon } from './Icons';

interface SidebarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  currentView: string;
  onViewChange: (view: string) => void;
  tags: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ activeFilter, onFilterChange, currentView, onViewChange, tags }) => {
  const menuItems = [
    { id: 'all', label: 'All Tasks', icon: FilterIcon },
    { id: 'today', label: 'Today', icon: CalendarIcon },
    { id: 'completed', label: 'Completed', icon: CheckCircleIcon },
  ];

  return (
    <div className="w-64 flex-shrink-0 hidden lg:flex flex-col h-[calc(100vh-8rem)] sticky top-28">
      
      {/* Navigation */}
      <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
        
        {/* Main Views */}
        <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-4">Focus</h2>
        <nav className="space-y-1 mb-10">
           <button
              onClick={() => onViewChange('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  currentView === 'dashboard' 
                  ? 'bg-white/5 text-white shadow-lg shadow-black/20' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <CheckCircleIcon className={`w-5 h-5 ${currentView === 'dashboard' ? 'text-indigo-400' : 'text-slate-500'}`} />
              Dashboard
            </button>
            
            <button
              onClick={() => onViewChange('clock')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  currentView === 'clock' 
                  ? 'bg-indigo-500/10 text-white shadow-lg shadow-indigo-500/10 border border-indigo-500/20' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <BoltIcon className={`w-5 h-5 ${currentView === 'clock' ? 'text-indigo-400' : 'text-slate-500'}`} />
              Time Machine
            </button>
        </nav>

        {currentView === 'dashboard' && (
        <>
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-4">Filters</h2>
            <nav className="space-y-1 mb-10">
            {menuItems.map(item => (
                <button
                key={item.id}
                onClick={() => onFilterChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                    activeFilter === item.id 
                    ? 'bg-white/5 text-white' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
                >
                <item.icon className={`w-4 h-4 ${activeFilter === item.id ? 'text-indigo-400' : 'text-slate-500'}`} />
                {item.label}
                </button>
            ))}
            </nav>

            {tags.length > 0 && (
            <>
                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-4">Tags</h2>
                <nav className="space-y-1 mb-8">
                {tags.map(tag => (
                    <button
                    key={tag}
                    onClick={() => onFilterChange(`tag:${tag}`)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                        activeFilter === `tag:${tag}` 
                        ? 'bg-white/5 text-indigo-300' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    >
                    <span className={`w-1.5 h-1.5 rounded-full ${activeFilter === `tag:${tag}` ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'bg-slate-700'}`}></span>
                    {tag}
                    </button>
                ))}
                </nav>
            </>
            )}
        </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
