import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { recordActivity, getCurrentStreak } from '@/utils/dailyStreak';

/**
 * Hook to manage daily streak
 * Automatically records activity and provides current streak count
 */
export const useDailyStreak = (autoRecordActivity: boolean = true) => {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setStreak(0);
      return;
    }

    // Record activity if autoRecordActivity is true
    if (autoRecordActivity) {
      const streakData = recordActivity(user.id);
      setStreak(streakData.currentStreak);
    } else {
      // Just get current streak without recording
      const currentStreak = getCurrentStreak(user.id);
      setStreak(currentStreak);
    }
  }, [user?.id, autoRecordActivity]);

  /**
   * Manually record an activity
   */
  const recordUserActivity = () => {
    if (!user?.id) return;
    const streakData = recordActivity(user.id);
    setStreak(streakData.currentStreak);
    return streakData.currentStreak;
  };

  return {
    streak,
    recordActivity: recordUserActivity,
  };
};

