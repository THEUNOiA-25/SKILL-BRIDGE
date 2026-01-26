import { useState, useMemo } from 'react';
import { TaskCard } from '@/pages/freelancer/projects/ProjectTracking/TaskCard';
import { getPhasesForCategory } from '@/pages/shared/projects/ProjectTracking/phaseMapping';
import { Task, TaskStatus } from '@/pages/shared/projects/ProjectTracking/types';
import { Activity } from '@/pages/freelancer/projects/ProjectTracking/ProjectTrackingDashboard';
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
  canApproveLockPhase,
  shouldLockPhase,
  getPhaseStatusBadge,
  getNextPhase
} from '@/pages/shared/projects/ProjectTracking/phaseLockingLogic';
import { PhaseState, PhaseStatus } from '@/pages/shared/projects/ProjectTracking/phaseLockingTypes';
import { ProjectTrackingDashboard } from '@/pages/freelancer/projects/ProjectTracking/ProjectTrackingDashboard';

interface ClientProjectTrackingBoardProps {
  projectId: string;
  projectCategory: string | null;
}

export const ClientProjectTrackingBoard = ({ projectId, projectCategory }: ClientProjectTrackingBoardProps) => {
  const { user } = useAuth();
  const phases = useMemo(() => getPhasesForCategory(projectCategory), [projectCategory]);
  const [tasks] = useState<Task[]>([]); // Read-only - tasks come from props/API
  const [activities] = useState<Activity[]>([]); // Read-only
  
  // Phase states management (read-only, comes from API)
  const [phaseStates, setPhaseStates] = useState<PhaseState[]>(() => {
    return phases.map((phase, index) => ({
      id: `phase-${index}`,
      project_id: projectId,
      phase_name: phase,
      phase_order: index + 1,
      status: 'unlocked' as PhaseStatus,
      freelancer_approved: false,
      client_approved: false,
      locked_at: null,
      locked_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  });
  
  // Lock approval dialog state
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [phaseToApprove, setPhaseToApprove] = useState<string | null>(null);
  
  // Get active phase
  const activePhase = useMemo(() => getActivePhase(phases, phaseStates), [phases, phaseStates]);
  
  // Handle approve lock phase (client approval)
  const handleApproveLockPhase = (phase: string) => {
    const validation = canApproveLockPhase(phase, phaseStates);
    if (!validation.allowed) {
      toast.error(validation.reason || 'Cannot approve lock for this phase');
      return;
    }
    
    // Set client approval
    setPhaseStates(prev => prev.map(ps => 
      ps.phase_name === phase
        ? {
            ...ps,
            client_approved: true,
            updated_at: new Date().toISOString(),
          }
        : ps
    ));
    
    toast.success('Lock approved. Phase will be locked.');
    setApproveDialogOpen(false);
    setPhaseToApprove(null);
  };

  // Check and lock phase if both approved
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

  // Open approve dialog
  const openApproveDialog = (phase: string) => {
    setPhaseToApprove(phase);
    setApproveDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-sm p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-600 font-medium">Total Tasks</span>
            <Folder className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-900">{metrics.total}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-600 font-medium">In Progress</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl font-bold text-slate-900">{metrics.inProgress}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-600 font-medium">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-xl font-bold text-slate-900">{metrics.completed}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-600 font-medium">Overdue</span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-xl font-bold text-slate-900">{metrics.overdue}</p>
        </div>
      </div>

      {/* Tasks Progress and Latest Activity - Below Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Tasks Progress */}
        <ProjectTrackingDashboard 
          tasks={tasks} 
          projectCategory={projectCategory} 
          activities={activities}
        />
      </div>

      {/* Kanban Board - Full Width */}
      <div>
        <h3 className="text-xs font-bold text-slate-900 mb-3">Kanban Board</h3>
        <div className="w-full overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex gap-3.5 min-w-max [&::-webkit-scrollbar]:hidden">
            {phases.map((phase, index) => {
              const phaseTasks = getTasksForPhase(phase);
              const phaseState = phaseStates.find(ps => ps.phase_name === phase);
              const isActive = phaseState?.status === 'active';
              const isLocked = phaseState?.status === 'locked';
              const isPending = phaseState?.status === 'pending';
              const badgeInfo = phaseState ? getPhaseStatusBadge(phaseState.status) : null;
              
              // Check if phase is complete (all tasks done)
              const isPhaseComplete = phaseTasks.length > 0 && phaseTasks.every(t => t.status === 'done');
              
              // Check if can approve lock (freelancer approved, client not yet)
              const canApprove = phaseState?.freelancer_approved && !phaseState?.client_approved;

              return (
                <div
                  key={phase}
                  className="flex-shrink-0 w-72 rounded-sm border border-slate-200 bg-white p-3.5"
                >
                  {/* Phase Header - Read Only */}
                  <div className="flex items-start justify-between mb-3.5">
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center bg-slate-400">
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
                    {/* No add button for client */}
                  </div>
                  
                  {/* Approve Lock Phase - Only when freelancer has approved */}
                  {isActive && isPhaseComplete && canApprove && (
                    <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-[10px] font-semibold text-blue-900 mb-0.5">Approve Lock Phase</p>
                          <p className="text-[9px] text-blue-600">
                            Freelancer has requested to lock this phase. Approve to proceed.
                          </p>
                        </div>
                        <Switch
                          checked={false}
                          onCheckedChange={() => openApproveDialog(phase)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Task Cards - Read Only */}
                  <div className="space-y-0">
                    {phaseTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={() => {}} // No-op for read-only
                        disabled={true} // Always disabled for client
                      />
                    ))}
                  </div>

                  {/* Empty State */}
                  {phaseTasks.length === 0 && (
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

      {/* Approve Lock Phase Confirmation Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Lock Phase</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve locking this phase? Once approved, the phase will be locked and cannot be modified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => phaseToApprove && handleApproveLockPhase(phaseToApprove)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Approve Lock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
