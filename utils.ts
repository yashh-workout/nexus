import { Priority } from './types';

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(date);
};

export const formatTime = (timestamp?: number): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(date);
};

export const getPriorityColor = (priority: Priority): string => {
  switch (priority) {
    case Priority.URGENT: return 'text-red-400 bg-red-400/10 border-red-400/20';
    case Priority.HIGH: return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    case Priority.MEDIUM: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case Priority.LOW: return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  }
};