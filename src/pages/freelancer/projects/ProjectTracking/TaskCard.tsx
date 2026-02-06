import { Task, TaskPriority, TaskStatus } from '@/pages/shared/projects/ProjectTracking/types';
import { format } from 'date-fns';
import { MessageCircle, Eye } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  disabled?: boolean;
}

const getPriorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case 'high':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'medium':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'low':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'to-do':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'in-progress':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'done':
      return 'bg-green-50 text-green-700 border-green-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

const getStatusLabel = (status: TaskStatus) => {
  switch (status) {
    case 'to-do':
      return 'To Do';
    case 'in-progress':
      return 'In Progress';
    case 'done':
      return 'Done';
    default:
      return status;
  }
};

export const TaskCard = ({ task, onStatusChange, disabled = false }: TaskCardProps) => {
  const priorityColor = getPriorityColor(task.priority);
  const statusColor = getStatusColor(task.status);

  // Get first letter of assignee name for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleStatusSelect = (newStatus: TaskStatus) => {
    if (disabled) return;
    onStatusChange(task.id, newStatus);
  };

  return (
    <div className={`bg-white border rounded-none p-2.5 shadow-sm transition-all mb-2.5 overflow-hidden ${
      disabled 
        ? 'border-slate-300 opacity-60 cursor-not-allowed' 
        : 'border-slate-200 hover:shadow-md'
    }`}>
      {/* Title */}
      <h4 className="font-semibold text-xs text-slate-900 mb-1 line-clamp-1 break-words">{task.title}</h4>
      
      {/* Description */}
      <p className="text-[11px] text-slate-600 mb-2.5 line-clamp-2 leading-relaxed break-words overflow-hidden">{task.description}</p>

      {/* Priority: Badge */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[11px] text-slate-600 font-medium">Priority:</span>
        <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold border ${priorityColor}`}>
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
        </span>
      </div>

      {/* Status: Badge */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[11px] text-slate-600 font-medium">Status:</span>
        {disabled ? (
          <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold border ${statusColor} opacity-60`}>
            {getStatusLabel(task.status)}
          </span>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold border ${statusColor} cursor-pointer hover:opacity-80 transition-opacity`}
              >
                {getStatusLabel(task.status)}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1" align="start">
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => handleStatusSelect('to-do')}
                  className="px-2.5 py-1 text-[11px] text-left hover:bg-slate-100 rounded-sm transition-colors"
                >
                  To Do
                </button>
                <button
                  onClick={() => handleStatusSelect('in-progress')}
                  className="px-2.5 py-1 text-[11px] text-left hover:bg-slate-100 rounded-sm transition-colors"
                >
                  In Progress
                </button>
                <button
                  onClick={() => handleStatusSelect('done')}
                  className="px-2.5 py-1 text-[11px] text-left hover:bg-slate-100 rounded-sm transition-colors"
                >
                  Done
                </button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Deadline: Date */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-[11px] text-slate-600 font-medium">Deadline:</span>
        <span className="text-[11px] text-slate-700 font-medium">
          {format(new Date(task.deadline), "d MMM")}
        </span>
      </div>

      {/* Separator Line */}
      <div className="border-t border-slate-200 mb-2.5"></div>

      {/* Avatars and Metrics */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {/* Avatar */}
          <div className="w-5 h-5 rounded-full bg-primary-purple text-white flex items-center justify-center text-[9px] font-bold">
            {getInitials(task.assignee)}
          </div>
          <span className="text-[11px] text-slate-700 font-medium">{task.assignee}</span>
        </div>
        
        {/* Comments and Views */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-0.5">
            <MessageCircle className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] text-slate-600">0</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Eye className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] text-slate-600">0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

