// Sequential Phase Locking Logic Functions with Dual Approval

import { PhaseState, PhaseStatus, ValidationResult } from './phaseLockingTypes';
import { Task } from './types';

/**
 * Get the currently active phase
 * Returns the first phase that is not locked
 */
export const getActivePhase = (
  phases: string[],
  phaseStates: PhaseState[]
): string | null => {
  // Find first phase that is 'active'
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    const phaseState = phaseStates.find(ps => ps.phase_name === phase);
    
    // If phase state is 'active', it's the active phase
    if (phaseState?.status === 'active') {
      return phase;
    }
  }
  
  // No active phase found
  return null;
};

/**
 * Check if a task status can be changed
 * Only allowed if task is in active phase
 */
export const canChangeTaskStatus = (
  task: Task,
  activePhase: string | null,
  phaseStates: PhaseState[]
): ValidationResult => {
  const phaseState = phaseStates.find(ps => ps.phase_name === task.phase);
  
  // If phase is locked, cannot change status
  if (phaseState?.status === 'locked') {
    return {
      allowed: false,
      reason: 'This phase is locked and cannot be modified'
    };
  }
  
  // If there's an active phase (after initial lock), only active phase can be modified
  if (activePhase && task.phase !== activePhase) {
    return {
      allowed: false,
      reason: `You can only modify tasks in the current active phase: ${activePhase}`
    };
  }
  
  // If phase is unlocked or active, allow status change
  return { allowed: true };
};

/**
 * Check if a new task can be added to a phase
 * Only allowed if phase is active
 */
export const canAddTaskToPhase = (
  phase: string,
  activePhase: string | null,
  phaseStates: PhaseState[],
  initialSetupComplete: boolean
): ValidationResult => {
  const phaseState = phaseStates.find(ps => ps.phase_name === phase);
  
  // If no phase states initialized yet, allow (initial setup)
  if (!phaseState) {
    return { allowed: true };
  }
  
  // If phase is locked, cannot add tasks
  if (phaseState.status === 'locked') {
    return {
      allowed: false,
      reason: 'This phase is locked and cannot be modified'
    };
  }
  
  // If phase is pending, cannot add tasks
  if (phaseState.status === 'pending') {
    return {
      allowed: false,
      reason: 'This phase is pending and cannot be modified'
    };
  }
  
  // Before initial setup is complete, unlocked phases can have tasks
  if (!initialSetupComplete && phaseState.status === 'unlocked') {
    return { allowed: true };
  }
  
  // After initial setup, only active phase can have tasks
  if (initialSetupComplete) {
    if (!activePhase) {
      return {
        allowed: false,
        reason: 'No active phase. All phases are locked.'
      };
    }
    
    if (phase !== activePhase) {
      return {
        allowed: false,
        reason: `You can only add tasks to the current active phase: ${activePhase}`
      };
    }
  }

  return { allowed: true };
};

/**
 * Check if freelancer can request to lock a phase
 * Only allowed if phase is active and all tasks are done
 */
export const canRequestLockPhase = (
  phase: string,
  tasks: Task[],
  phaseStates: PhaseState[]
): ValidationResult => {
  const phaseState = phaseStates.find(ps => ps.phase_name === phase);
  
  // Check if already locked
  if (phaseState?.status === 'locked') {
    return {
      allowed: false,
      reason: 'Phase is already locked'
    };
  }

  // Check if phase is active
  if (phaseState?.status !== 'active') {
    return {
      allowed: false,
      reason: 'Only active phases can be locked'
    };
  }

  // Check if freelancer already approved
  if (phaseState.freelancer_approved) {
    return {
      allowed: false,
      reason: 'You have already requested lock. Waiting for client approval.'
    };
  }

  // Check if all tasks are done
  const phaseTasks = tasks.filter(t => t.phase === phase);
  if (phaseTasks.length === 0) {
    return {
      allowed: false,
      reason: 'Phase must have at least one task before locking'
    };
  }

  const allTasksDone = phaseTasks.every(task => task.status === 'done');
  if (!allTasksDone) {
    return {
      allowed: false,
      reason: 'All tasks in this phase must be completed before locking'
    };
  }

  return { allowed: true };
};

/**
 * Check if client can approve lock for a phase
 * Only allowed if freelancer has already approved
 */
export const canApproveLockPhase = (
  phase: string,
  phaseStates: PhaseState[]
): ValidationResult => {
  const phaseState = phaseStates.find(ps => ps.phase_name === phase);
  
  if (!phaseState) {
    return {
      allowed: false,
      reason: 'Phase state not found'
    };
  }

  // Check if already locked
  if (phaseState.status === 'locked') {
    return {
      allowed: false,
      reason: 'Phase is already locked'
    };
  }

  // Check if freelancer has approved first
  if (!phaseState.freelancer_approved) {
    return {
      allowed: false,
      reason: 'Freelancer must request lock first'
    };
  }

  // Check if client already approved
  if (phaseState.client_approved) {
    return {
      allowed: false,
      reason: 'You have already approved. Phase will be locked.'
    };
  }

  return { allowed: true };
};

/**
 * Check if phase should be locked (both approvals received)
 */
export const shouldLockPhase = (phaseState: PhaseState): boolean => {
  return phaseState.freelancer_approved && phaseState.client_approved && phaseState.status !== 'locked';
};

/**
 * Check if all phases can be locked (initial lock)
 * Only allowed if all phases have at least one task
 */
export const canLockAllPhases = (
  phases: string[],
  tasks: Task[]
): ValidationResult => {
  // Check if all phases have at least one task
  for (const phase of phases) {
    const phaseTasks = tasks.filter(t => t.phase === phase);
    if (phaseTasks.length === 0) {
      return {
        allowed: false,
        reason: `Phase "${phase}" must have at least one task before locking all phases`
      };
    }
  }

  return { allowed: true };
};

/**
 * Get phase status badge
 */
export const getPhaseStatusBadge = (status: PhaseStatus): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
} => {
  switch (status) {
    case 'active':
      return {
        label: 'Active',
        variant: 'default',
        className: 'bg-green-500/10 text-green-700 border-green-200'
      };
    case 'pending':
      return {
        label: 'Pending',
        variant: 'secondary',
        className: 'bg-yellow-500/10 text-yellow-700 border-yellow-200'
      };
    case 'locked':
      return {
        label: 'Locked',
        variant: 'outline',
        className: 'bg-slate-500/10 text-slate-700 border-slate-200'
      };
    case 'unlocked':
      return {
        label: 'Unlocked',
        variant: 'secondary',
        className: 'bg-blue-500/10 text-blue-700 border-blue-200'
      };
    default:
      return {
        label: 'Unknown',
        variant: 'secondary',
        className: 'bg-slate-500/10 text-slate-700 border-slate-200'
      };
  }
};

/**
 * Get next phase after locking current phase
 */
export const getNextPhase = (
  currentPhase: string,
  phases: string[]
): string | null => {
  const currentIndex = phases.indexOf(currentPhase);
  if (currentIndex === -1 || currentIndex === phases.length - 1) {
    return null; // No next phase
  }
  return phases[currentIndex + 1];
};
