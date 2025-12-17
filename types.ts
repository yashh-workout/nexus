
export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent'
}

export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed'
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string; // ISO String
  duration?: number; // Duration in minutes
  completedAt?: number; // Timestamp of completion
  tags: string[];
  subtasks: Subtask[];
  link?: string; // External URL resource
  createdAt: number;
  column: 'today' | 'tomorrow';
  color?: string; // Color hex for the time slot visualization
  order: number; // For manual ordering
}
