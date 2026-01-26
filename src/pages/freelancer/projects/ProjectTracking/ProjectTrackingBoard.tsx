import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { getPhasesForCategory } from '@/pages/shared/projects/ProjectTracking/phaseMapping';
import { Task, TaskStatus } from '@/pages/shared/projects/ProjectTracking/types';
import { Activity } from './ProjectTrackingDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CheckCircle2, Clock, AlertCircle, TrendingUp, TrendingDown, 
  Folder, MessageCircle, Eye 
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  getActivePhase, 
  canChangeTaskStatus, 
  canAddTaskToPhase, 
  canRequestLockPhase,
  shouldLockPhase,
  canLockAllPhases,
  getPhaseStatusBadge,
  getNextPhase
} from '@/pages/shared/projects/ProjectTracking/phaseLockingLogic';
import { PhaseState, PhaseStatus } from '@/pages/shared/projects/ProjectTracking/phaseLockingTypes';

interface ProjectTrackingBoardProps {
  projectId: string;
  projectCategory: string | null;
}

export const ProjectTrackingBoard = ({ projectId, projectCategory }: ProjectTrackingBoardProps) => {
  const { user } = useAuth();
  const phases = useMemo(() => getPhasesForCategory(projectCategory), [projectCategory]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showFormForPhase, setShowFormForPhase] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  
  // Phase states management
  const [phaseStates, setPhaseStates] = useState<PhaseState[]>(() => {
    // Initially all phases are 'unlocked' (allows task creation in all phases)
    // After "Lock All": Phase 1 = 'active', others = 'pending'
    return phases.map((phase, index) => ({
      id: `phase-${index}`,
      project_id: projectId,
      phase_name: phase,
      phase_order: index + 1,
      status: 'unlocked' as PhaseStatus, // All start unlocked initially
      freelancer_approved: false,
      client_approved: false,
      locked_at: null,
      locked_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  });
  
  // Lock phase dialog state
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [phaseToLock, setPhaseToLock] = useState<string | null>(null);
  const [lockAllDialogOpen, setLockAllDialogOpen] = useState(false);
  
  // Get active phase
  const activePhase = useMemo(() => getActivePhase(phases, phaseStates), [phases, phaseStates]);
  
  // Check if all phases are locked (initial setup complete)
  const allPhasesLocked = useMemo(() => {
    return phaseStates.every(ps => ps.status === 'locked');
  }, [phaseStates]);
  
  // Track if "Lock All" has been clicked (should only show once)
  const [hasLockedAllPhases, setHasLockedAllPhases] = useState(false);
  
  // Check if initial setup is complete (Phase 1 is active and others are pending)
  const initialSetupComplete = useMemo(() => {
    // Check if Phase 1 is active (means "Lock All" has been clicked)
    const phase1 = phaseStates.find(ps => ps.phase_order === 1);
    return phase1?.status === 'active' || hasLockedAllPhases;
  }, [phaseStates, hasLockedAllPhases]);
  
  // Check if initial lock is needed (all phases have tasks but "Lock All" not clicked yet)
  const needsInitialLock = useMemo(() => {
    if (hasLockedAllPhases || initialSetupComplete) return false;
    // Check if all phases have at least one task
    const allPhasesHaveTasks = phases.every(phase => {
      const phaseTasks = tasks.filter(t => t.phase === phase);
      return phaseTasks.length > 0;
    });
    return allPhasesHaveTasks;
  }, [phases, tasks, initialSetupComplete, hasLockedAllPhases]);

  // Get user name for activities
  const getUserName = () => {
    if (user?.user_metadata?.first_name || user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name || ''} ${user.user_metadata.last_name || ''}`.trim();
    }
    return user?.email?.split('@')[0] || 'User';
  };

  const handleCreateTask = (phase: string, taskData: {
    title: string;
    description: string;
    assignee: string;
    deadline: string;
    priority: 'high' | 'medium' | 'low';
    status: TaskStatus;
  }) => {
    // Validate if task can be added to this phase
    const validation = canAddTaskToPhase(phase, activePhase, phaseStates, initialSetupComplete);
    if (!validation.allowed) {
      toast.error(validation.reason || 'Cannot add task to this phase');
      setShowFormForPhase(null);
      return;
    }
    
    const phaseIndex = phases.indexOf(phase);
    const newTask: Task = {
      id: Date.now().toString(),
      ...taskData,
      status: 'to-do', // Always set to 'to-do' when creating a task
      phase,
      projectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setTasks([...tasks, newTask]);
    setShowFormForPhase(null);
    toast.success('Task created successfully');
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Validate if task status can be changed
    const validation = canChangeTaskStatus(task, activePhase, phaseStates);
    if (!validation.allowed) {
      toast.error(validation.reason || 'Cannot change task status');
      return;
    }

    const oldStatus = task.status;
    
    // Update task
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
        : task
    ));

    // Log activity
    if (oldStatus !== newStatus) {
      const newActivity: Activity = {
        id: Date.now().toString(),
        userName: getUserName(),
        taskName: task.title,
        oldStatus: oldStatus,
        newStatus: newStatus,
        phase: task.phase,
        timestamp: new Date().toISOString(),
      };
      setActivities(prev => [newActivity, ...prev].slice(0, 50)); // Keep last 50 activities
    }
  };
  
  // Handle lock all phases (initial setup)
  const handleLockAllPhases = () => {
    const validation = canLockAllPhases(phases, tasks);
    if (!validation.allowed) {
      toast.error(validation.reason || 'Cannot lock all phases');
      return;
    }
    
    // Set Phase 1 as active, others as pending (not locked)
    setPhaseStates(prev => prev.map((ps, index) => {
      if (index === 0) {
        return { ...ps, status: 'active' as PhaseStatus, updated_at: new Date().toISOString() };
      }
      return { 
        ...ps, 
        status: 'pending' as PhaseStatus, // Pending, not locked
        updated_at: new Date().toISOString(),
      };
    }));
    
    // Mark that "Lock All" has been clicked (so it never shows again)
    setHasLockedAllPhases(true);
    setLockAllDialogOpen(false);
    toast.success('Initial setup complete. Phase 1 is now active.');
  };
  
  // Handle request lock phase (freelancer approval)
  const handleRequestLockPhase = (phase: string) => {
    const validation = canRequestLockPhase(phase, tasks, phaseStates);
    if (!validation.allowed) {
      toast.error(validation.reason || 'Cannot request lock for this phase');
      return;
    }
    
    // Set freelancer approval
    setPhaseStates(prev => prev.map(ps => 
      ps.phase_name === phase
        ? {
            ...ps,
            freelancer_approved: true,
            updated_at: new Date().toISOString(),
          }
        : ps
    ));
    
    toast.success('Lock request sent. Waiting for client approval.');
    setLockDialogOpen(false);
    setPhaseToLock(null);
  };

  // Check and lock phase if both approved (this runs when client approves)
  useMemo(() => {
    phaseStates.forEach(phaseState => {
      if (shouldLockPhase(phaseState)) {
        // Both approved - lock the phase
        setPhaseStates(prev => prev.map(ps => 
          ps.phase_name === phaseState.phase_name
            ? {
                ...ps,
                status: 'locked' as PhaseStatus,
                locked_at: new Date().toISOString(),
                locked_by: user?.id || null,
                updated_at: new Date().toISOString(),
              }
            : ps
        ));
        
        // Unlock next phase
        const nextPhase = getNextPhase(phaseState.phase_name, phases);
        if (nextPhase) {
          setPhaseStates(prev => prev.map(ps => 
            ps.phase_name === nextPhase
              ? { 
                  ...ps, 
                  status: 'active' as PhaseStatus,
                  freelancer_approved: false,
                  client_approved: false,
                  updated_at: new Date().toISOString() 
                }
              : ps
          ));
          toast.success(`Phase "${phaseState.phase_name}" locked. Phase "${nextPhase}" is now active.`);
        } else {
          toast.success(`Phase "${phaseState.phase_name}" locked. All phases complete!`);
        }
      }
    });
  }, [phaseStates, phases, user?.id]);
  
  // Open lock dialog
  const openLockDialog = (phase: string) => {
    setPhaseToLock(phase);
    setLockDialogOpen(true);
  };

  // Check if waiting for client approval
  const isWaitingForClient = (phaseState: PhaseState) => {
    return phaseState.freelancer_approved && !phaseState.client_approved;
  };

  const getTasksForPhase = (phase: string): Task[] => {
    return tasks.filter(task => task.phase === phase);
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const overdue = tasks.filter(t => {
      if (t.status === 'done') return false;
      return new Date(t.deadline) < new Date();
    }).length;
    return { total, inProgress, completed, overdue };
  }, [tasks]);

  // Calculate phase progress
  const phaseProgress = useMemo(() => {
    return phases.map((phase, index) => {
      const phaseTasks = tasks.filter(t => t.phase === phase);
      const totalTasks = phaseTasks.length;
      const completedTasks = phaseTasks.filter(t => t.status === 'done').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const assignees = Array.from(new Set(phaseTasks.map(t => t.assignee)));
      return {
        phase,
        phaseNumber: index + 1,
        totalTasks,
        completedTasks,
        progress,
        assignees,
      };
    });
  }, [phases, tasks]);

  // Calculate task status distribution for chart
  const taskStatusData = useMemo(() => {
    const toDo = tasks.filter(t => t.status === 'to-do').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const done = tasks.filter(t => t.status === 'done').length;
    return [
      { name: 'Not Started', value: toDo, color: '#8b5cf6' },
      { name: 'On Progress', value: inProgress, color: '#3b82f6' },
      { name: 'Completed', value: done, color: '#10b981' },
    ].filter(item => item.value > 0);
  }, [tasks]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatActivityDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) {
      return `Today ${d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    } else if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    } else {
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  };

  const groupedActivities = useMemo(() => {
    const groups: Record<string, Activity[]> = {};
    activities.forEach(activity => {
      const date = formatActivityDate(activity.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
    });
    return groups;
  }, [activities]);

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'to-do': return 'Not Started';
      case 'in-progress': return 'On Progress';
      case 'done': return 'Completed';
      default: return status;
    }
  };

  const chartConfig = {
    'not-started': { label: 'Not Started', color: '#8b5cf6' },
    'on-progress': { label: 'On Progress', color: '#3b82f6' },
    'completed': { label: 'Completed', color: '#10b981' },
  };

  const phaseColors = ['#10b981', '#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="w-full pb-4 px-3.5 space-y-3.5">
      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-sm p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-slate-600 font-medium">Total task</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-slate-900">{metrics.total}</span>
            <div className="flex items-center gap-0.5 text-green-600">
              <TrendingUp className="w-2.5 h-2.5" />
              <span className="text-[9px] font-semibold">+7%</span>
            </div>
          </div>
          <p className="text-[8px] text-slate-500 mt-0.5">from last month</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-slate-600 font-medium">On progress</span>
            <Clock className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-slate-900">{metrics.inProgress}</span>
            <div className="flex items-center gap-0.5 text-green-600">
              <TrendingUp className="w-2.5 h-2.5" />
              <span className="text-[9px] font-semibold">+3%</span>
            </div>
          </div>
          <p className="text-[8px] text-slate-500 mt-0.5">from last month</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-slate-600 font-medium">Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-slate-900">{metrics.completed}</span>
            <div className="flex items-center gap-0.5 text-green-600">
              <TrendingUp className="w-2.5 h-2.5" />
              <span className="text-[9px] font-semibold">+9%</span>
            </div>
          </div>
          <p className="text-[8px] text-slate-500 mt-0.5">from last month</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-slate-600 font-medium">Overdue</span>
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-slate-900">{metrics.overdue}</span>
            <div className="flex items-center gap-0.5 text-red-600">
              <TrendingDown className="w-2.5 h-2.5" />
              <span className="text-[9px] font-semibold">-2%</span>
            </div>
          </div>
          <p className="text-[8px] text-slate-500 mt-0.5">from last month</p>
        </div>
      </div>

      {/* Project Overview */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-900">Project overview</h3>
        <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex gap-3 min-w-max [&::-webkit-scrollbar]:hidden">
            {phaseProgress.map((phase, index) => {
              const color = phaseColors[index % phaseColors.length];
              return (
                <div key={phase.phase} className="flex-shrink-0 w-56 bg-white border border-slate-200 rounded-sm p-3 shadow-sm">
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-7 h-7 rounded-sm flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                        <Folder className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-900">
                          Phase {phase.phaseNumber}: {phase.phase}
                        </h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          {phase.assignees.slice(0, 4).map((assignee, idx) => (
                            <div
                              key={idx}
                              className="w-4 h-4 rounded-full bg-primary-purple text-white flex items-center justify-center text-[8px] font-bold"
                            >
                              {getInitials(assignee)}
                            </div>
                          ))}
                          {phase.assignees.length > 4 && (
                            <span className="text-[8px] text-slate-600">+{phase.assignees.length - 4}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] text-slate-600">
                      {phase.completedTasks} of {phase.totalTasks} tasks completed
                    </span>
                    <span className="text-[9px] font-bold text-slate-900">{phase.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${phase.progress}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Kanban Board - Full Width */}
      <div>
        {/* Lock All Phases Button - Above Kanban Board title (Only shows once during initial setup) */}
        {needsInitialLock && !hasLockedAllPhases && (
          <div className="mb-4 bg-white border border-slate-200 rounded-sm p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 mb-1">Initial Setup</h3>
                <p className="text-[10px] text-slate-600">
                  All phases have tasks. Lock all phases to start the project.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-600 font-medium">Lock All Phases</span>
                <Switch
                  checked={false}
                  onCheckedChange={() => setLockAllDialogOpen(true)}
                />
              </div>
            </div>
          </div>
        )}
        
        <h3 className="text-xs font-bold text-slate-900 mb-3">Kanban Board</h3>
        <div className="w-full overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex gap-3.5 min-w-max [&::-webkit-scrollbar]:hidden">
            {phases.map((phase, index) => {
              const phaseTasks = getTasksForPhase(phase);
              const isFormOpen = showFormForPhase === phase;
              const phaseState = phaseStates.find(ps => ps.phase_name === phase);
              const isActive = phaseState?.status === 'active';
              const isLocked = phaseState?.status === 'locked';
              const isUnlocked = phaseState?.status === 'unlocked' || !phaseState;
              const isPending = phaseState?.status === 'pending';
              const badgeInfo = phaseState ? getPhaseStatusBadge(phaseState.status) : null;
              
              // Check if phase is complete (all tasks done)
              const isPhaseComplete = phaseTasks.length > 0 && phaseTasks.every(t => t.status === 'done');
              
              // Can add task:
              // - Before initial setup: if phase is active (Phase 1) or pending (others can have tasks initially)
              // - After initial setup: if phase is active
              let canAddTask = true; // Default to true to allow form to show
              
              if (phaseState) {
                if (initialSetupComplete) {
                  // After setup, only active phase can have tasks
                  canAddTask = isActive;
                } else {
                  // Before setup, active phase (Phase 1) can have tasks, others can too initially
                  canAddTask = isActive || isPending || isUnlocked;
                }
              }
              
              // Check if form should be shown for this phase
              const shouldShowForm = isFormOpen && canAddTask;

              return (
                <div
                  key={phase}
                  className={`flex-shrink-0 w-72 rounded-sm border p-3.5 ${
                    isActive 
                      ? 'bg-green-50 border-green-200' 
                      : isLocked 
                        ? 'bg-slate-100 border-slate-300 opacity-75' 
                        : isUnlocked
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-slate-50 border-slate-200 opacity-50'
                  }`}
                >
                  {/* Phase Header */}
                  <div className="flex items-start justify-between mb-3.5">
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className={`w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center ${
                        isActive ? 'bg-green-600' : isLocked ? 'bg-slate-500' : 'bg-slate-400'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-xs text-slate-900">{phase}</h3>
                          {badgeInfo && (
                            <Badge className={`${badgeInfo.className} text-[9px] px-1.5 py-0.5`}>
                              {badgeInfo.label}
                            </Badge>
                          )}
                        </div>
                        {isLocked && phaseState.locked_at && (
                          <p className="text-[9px] text-slate-500">
                            Locked {new Date(phaseState.locked_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    {canAddTask && !isFormOpen && (
                      <button
                        onClick={() => {
                          console.log('Add button clicked for phase:', phase);
                          setShowFormForPhase(phase);
                        }}
                        className="w-5 h-5 rounded-full bg-primary-purple text-white flex items-center justify-center hover:bg-primary-purple/90 transition-colors flex-shrink-0"
                        title="Add task"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  
                  {/* Lock Phase Toggle - Only for active phase when complete */}
                  {isActive && isPhaseComplete && (
                    <div className="mb-3 p-2 bg-white rounded-sm border border-slate-200">
                      {!phaseState.freelancer_approved ? (
                        // Show "Request Lock" button
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-[10px] font-semibold text-slate-900 mb-0.5">Request Lock Phase</p>
                            <p className="text-[9px] text-slate-600">
                              All tasks completed. Request lock to proceed to next phase.
                            </p>
                          </div>
                          <Switch
                            checked={false}
                            onCheckedChange={() => openLockDialog(phase)}
                          />
                        </div>
                      ) : !phaseState.client_approved ? (
                        // Show "Waiting for client" message
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-[10px] font-semibold text-blue-900 mb-0.5">Waiting for Client Approval</p>
                            <p className="text-[9px] text-blue-600">
                              Lock request sent. Waiting for client to approve.
                            </p>
                          </div>
                          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                            <Clock className="w-3 h-3 text-blue-600" />
                          </div>
                        </div>
                      ) : (
                        // Both approved - phase will be locked
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-[10px] font-semibold text-green-900 mb-0.5">Lock Approved</p>
                            <p className="text-[9px] text-green-600">
                              Both approvals received. Phase will be locked.
                            </p>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Task Form - Show when form is open for this phase */}
                  {isFormOpen && (
                    <div className="mb-3">
                      <TaskForm
                        phase={phase}
                        projectId={projectId}
                        activePhase={activePhase}
                        onSave={(taskData) => {
                          console.log('Task form submitted for phase:', phase);
                          handleCreateTask(phase, taskData);
                        }}
                        onCancel={() => {
                          console.log('Task form cancelled');
                          setShowFormForPhase(null);
                        }}
                      />
                    </div>
                  )}

                  {/* Task Cards */}
                  <div className="space-y-0">
                    {phaseTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={handleStatusChange}
                        disabled={!isActive}
                      />
                    ))}
                  </div>

                  {/* Empty State */}
                  {!isFormOpen && phaseTasks.length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-[11px]">
                      No tasks yet
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tasks Progress and Latest Activity - Below Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Tasks Progress */}
          <div className="bg-white border border-slate-200 rounded-sm p-3 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 mb-2.5">Tasks progress</h3>
            {taskStatusData.length > 0 ? (
              <div className="relative h-[180px]">
                <ChartContainer config={chartConfig} className="h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {taskStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-[9px] text-slate-600 font-medium">Total task</p>
                    <p className="text-lg font-bold text-slate-900">{metrics.total}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-slate-400 text-[10px]">
                No tasks yet
              </div>
            )}
            <div className="mt-2.5 space-y-1">
              {taskStatusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-[9px]">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {metrics.total > 0 ? Math.round((item.value / metrics.total) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Latest Activity */}
          <div className="bg-white border border-slate-200 rounded-sm p-3 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 mb-2.5">Latest Activity</h3>
            <div className="space-y-2.5 max-h-[350px] overflow-y-auto">
              {Object.entries(groupedActivities).map(([date, dateActivities]) => (
                <div key={date}>
                  <h4 className="text-[9px] font-bold text-slate-600 mb-1.5">{date}</h4>
                  <div className="space-y-2">
                    {dateActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-primary-purple text-white flex items-center justify-center text-[8px] font-bold flex-shrink-0">
                          {getInitials(activity.userName)}
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] text-slate-900 leading-relaxed">
                            <span className="font-semibold">{activity.userName}</span>
                            {' '}changed task{' '}
                            <span className="font-semibold">"{activity.taskName}"</span>
                            {activity.oldStatus && (
                              <> from <span className="font-semibold">{getStatusLabel(activity.oldStatus)}</span></>
                            )}
                            {' '}to <span className="font-semibold">{getStatusLabel(activity.newStatus)}</span>
                            {' '}in <span className="font-semibold">Phase {phases.findIndex(p => p === activity.phase) + 1}: {activity.phase}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="text-center py-3 text-slate-400 text-[9px]">
                  No activity yet
                </div>
              )}
            </div>
          </div>
      </div>
      
      {/* Lock Phase Confirmation Dialog */}
      <AlertDialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Lock Phase</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to request to lock this phase?
              </p>
              <p className="font-semibold text-red-600">
                ⚠️ Important: Once this phase is locked, you cannot come back and modify anything in this phase. It will be permanently locked.
              </p>
              <p>
                The client needs to accept your lock request for the phase to be locked. 
              </p>
              <p className="font-medium text-blue-600">
                💡 Recommendation: Schedule a review call with your client for this phase. During the meeting, have your client approve and lock the phase together.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => phaseToLock && handleRequestLockPhase(phaseToLock)}
              className="bg-red-600 hover:bg-red-700"
            >
              Request Lock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Lock All Phases Confirmation Dialog */}
      <AlertDialog open={lockAllDialogOpen} onOpenChange={setLockAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lock All Phases</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to lock all phases? Once locked, you can't modify tasks in locked phases. Phase 1 will become active and you can start working on it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLockAllPhases}
              className="bg-primary-purple hover:bg-primary-purple/90"
            >
              Lock All Phases
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

