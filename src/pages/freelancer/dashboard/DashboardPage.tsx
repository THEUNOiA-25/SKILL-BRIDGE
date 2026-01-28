import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Bell, MessageSquare, FileText, Search, 
  Target, Calendar, CheckSquare2, Eye, 
  Flame, Quote, ArrowRight, Plus,
  Wallet, Package, FileCheck, Gavel, Rss,
  GraduationCap, Briefcase, Star, Users, Clock, TrendingUp,
  DollarSign, TrendingDown, BarChart3, PieChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useDailyStreak } from '@/hooks/useDailyStreak';
import { recordActivity } from '@/utils/dailyStreak';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, addDays, isSameDay, getDay } from 'date-fns';
import { X, GripVertical, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface Project {
  id: string;
  title: string;
  status: string;
  budget: number | null;
  created_at: string;
  bidding_deadline: string | null;
  user_profiles?: {
    first_name: string;
    last_name: string;
  };
}

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { streak } = useDailyStreak(true); // Auto-record activity on dashboard visit
  const [profile, setProfile] = useState<{ first_name: string; last_name: string } | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newBidsOnProjects, setNewBidsOnProjects] = useState<Array<{
    id: string;
    amount: number;
    created_at: string;
    user_projects: {
      id: string;
      title: string;
      user_id: string;
    };
  }>>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({
    successful: 0,
    ongoing: 0,
    pending: 0,
  });

  // To-Do List state
  type Priority = 'low' | 'medium' | 'high';
  
  interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    priority: Priority;
  }

  const [todos, setTodos] = useState<TodoItem[]>([
    { id: '1', text: 'Submit final M4 UI assets', completed: true, priority: 'high' },
    { id: '2', text: 'Review client feedback doc', completed: false, priority: 'medium' },
    { id: '3', text: 'Invoice Stripe for October', completed: false, priority: 'low' },
  ]);
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');

  // Weekly Planner state
  interface WeeklyTask {
    id: string;
    text: string;
    completed: boolean;
    priority: Priority;
  }

  interface DayData {
    date: Date;
    tasks: WeeklyTask[];
    focus: 'work' | 'learning' | 'personal' | null;
  }

  const [weeklyPlannerOpen, setWeeklyPlannerOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [weeklyData, setWeeklyData] = useState<Map<string, DayData>>(new Map());
  const [newWeeklyTaskText, setNewWeeklyTaskText] = useState('');
  const [newWeeklyTaskPriority, setNewWeeklyTaskPriority] = useState<Priority>('medium');
  const [selectedFocus, setSelectedFocus] = useState<'work' | 'learning' | 'personal' | null>('work');

  // Weekly Roadmap Widget state (separate from planner dialog)
  const [roadmapSelectedDay, setRoadmapSelectedDay] = useState<Date>(new Date());

  // Tech news items data
  const techNewsItems = [
    { source: "TechCrunch", time: "2h ago", icon: "T", iconBg: "bg-black", headline: "Apple releases new M4 chips with focus on AI capabilities." },
    { source: "The Verge", time: "5h ago", icon: "V", iconBg: "bg-blue-600", headline: "Google's Project Astra: The future of multimodal AI assistants." },
    { source: "Wired", time: "1d ago", icon: "W", iconBg: "bg-red-600", headline: "How Decentralized Computing is Changing the Freelance Economy." },
    { source: "Hacker News", time: "3h ago", icon: "H", iconBg: "bg-emerald-600", headline: "The Best Open Source Tools for Freelance Project Management in 2024." },
    { source: "Ars Technica", time: "4h ago", icon: "A", iconBg: "bg-purple-600", headline: "Microsoft announces breakthrough in quantum computing with new Azure Quantum platform." },
    { source: "Engadget", time: "6h ago", icon: "E", iconBg: "bg-orange-600", headline: "OpenAI releases GPT-5 with enhanced reasoning capabilities and multimodal understanding." },
    { source: "MIT Tech Review", time: "8h ago", icon: "M", iconBg: "bg-indigo-600", headline: "Breakthrough in neural interfaces enables direct brain-to-computer communication." },
    { source: "CNET", time: "12h ago", icon: "C", iconBg: "bg-pink-600", headline: "Tesla unveils next-generation autonomous driving system with improved safety features." },
  ];

  // Combined suggested items (classes and projects mixed)
  const suggestedItems = [
    { 
      id: 1, 
      type: "class",
      title: "Advanced React Development", 
      instructor: "Sarah Johnson", 
      duration: "8 weeks", 
      students: 1240, 
      rating: 4.8, 
      icon: "⚛️", 
      color: "bg-blue-50", 
      iconColor: "text-blue-600", 
      badge: "Best Ratings",
      animation: "slide-in-left"
    },
    { 
      id: 2, 
      type: "project",
      title: "E-commerce Website Redesign", 
      client: "TechCorp Inc.", 
      budget: "₹25,000", 
      deadline: "15 days", 
      skills: ["React", "UI/UX"], 
      icon: "🛒", 
      color: "bg-orange-50", 
      iconColor: "text-orange-600", 
      badge: "Recommended Batch",
      animation: "slide-in-right"
    },
    { 
      id: 3, 
      type: "class",
      title: "UI/UX Design Masterclass", 
      instructor: "Michael Chen", 
      duration: "6 weeks", 
      students: 890, 
      rating: 4.9, 
      icon: "🎨", 
      color: "bg-purple-50", 
      iconColor: "text-purple-600", 
      badge: "Top Recommended",
      animation: "bounce-in"
    },
    { 
      id: 4, 
      type: "project",
      title: "Mobile App Development", 
      client: "StartupXYZ", 
      budget: "₹45,000", 
      deadline: "30 days", 
      skills: ["React Native", "Node.js"], 
      icon: "📱", 
      color: "bg-indigo-50", 
      iconColor: "text-indigo-600", 
      badge: "Recommended Batch",
      animation: "slide-in-left"
    },
    { 
      id: 5, 
      type: "class",
      title: "Full Stack Web Development", 
      instructor: "David Williams", 
      duration: "12 weeks", 
      students: 2100, 
      rating: 4.7, 
      icon: "💻", 
      color: "bg-emerald-50", 
      iconColor: "text-emerald-600", 
      badge: "Best Ratings",
      animation: "slide-in-right"
    },
    { 
      id: 6, 
      type: "project",
      title: "Brand Identity Design", 
      client: "Creative Studio", 
      budget: "₹15,000", 
      deadline: "10 days", 
      skills: ["Figma", "Illustration"], 
      icon: "✨", 
      color: "bg-pink-50", 
      iconColor: "text-pink-600", 
      badge: "Recommended Batch",
      animation: "bounce-in"
    },
  ];

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [user]);

  // Fetch notifications
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        // Get unread messages count
        const { count: msgCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('is_read', false)
          .neq('sender_id', user.id);
        
        setUnreadMessages(msgCount || 0);

        // Get recent bids on user's projects (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: recentBids } = await supabase
          .from('bids')
          .select(`
            id,
            amount,
            created_at,
            user_projects!inner(id, title, user_id)
          `)
          .eq('user_projects.user_id', user.id)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(5);

        setNewBidsOnProjects(recentBids || []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [user]);

  // Fetch stats and active projects
  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        // Get completed projects
        const { count: successfulCount } = await supabase
          .from('user_projects')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed');

        // Get ongoing projects
        const { count: ongoingCount } = await supabase
          .from('user_projects')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'in_progress');

        // Get pending projects (open with bids)
        const { count: pendingCount } = await supabase
          .from('user_projects')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'open');

        setStats({
          successful: successfulCount || 0,
          ongoing: ongoingCount || 0,
          pending: pendingCount || 0,
        });

        // Fetch active projects (in_progress)
        const { data: projects } = await supabase
          .from('user_projects')
          .select(`
            id,
            title,
            status,
            budget,
            created_at,
            bidding_deadline
          `)
          .eq('user_id', user.id)
          .in('status', ['in_progress', 'open'])
          .order('created_at', { ascending: false })
          .limit(3);

        setActiveProjects(projects || []);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [user]);

  const totalNotifications = unreadMessages + newBidsOnProjects.length;
  const firstName = profile?.first_name || 'User';
  const userName = `${firstName}`;

  // Calculate today's goal progress (mock data for now)
  const todayGoalProgress = 75;
  const todayTasksCompleted = 3;
  const todayTasksTotal = 4;

  // Load todos from localStorage on mount
  useEffect(() => {
    if (!user?.id) return;
    const storedTodos = localStorage.getItem(`todos_${user.id}`);
    if (storedTodos) {
      try {
        setTodos(JSON.parse(storedTodos));
      } catch (error) {
        console.error('Error loading todos:', error);
      }
    }
  }, [user?.id]);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    if (!user?.id) return;
    localStorage.setItem(`todos_${user.id}`, JSON.stringify(todos));
  }, [todos, user?.id]);

  // Toggle todo completion
  const toggleTodo = (id: string) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
    // Record activity for daily streak when task is completed
    if (user?.id) {
      const todo = todos.find(t => t.id === id);
      if (todo && !todo.completed) {
        recordActivity(user.id);
      }
    }
  };

  // Add new task
  const handleAddTask = () => {
    if (!newTaskText.trim()) {
      toast.error('Please enter a task');
      return;
    }
    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      priority: newTaskPriority,
    };
    setTodos(prevTodos => [...prevTodos, newTodo]);
    setNewTaskText('');
    setNewTaskPriority('medium');
    setAddTaskDialogOpen(false);
    // Record activity for daily streak (to-do list updated)
    if (user?.id) {
      recordActivity(user.id);
    }
    toast.success('Task added successfully');
  };

  // Get priority badge styling using Primary, Secondary, and Accent colors
  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return 'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary';
      case 'medium':
        return 'bg-secondary/50 text-secondary-foreground dark:bg-secondary/30 dark:text-secondary-foreground';
      case 'low':
        return 'bg-accent/50 text-accent-foreground dark:bg-accent/30 dark:text-accent-foreground';
      default:
        return 'bg-accent/50 text-accent-foreground dark:bg-accent/30 dark:text-accent-foreground';
    }
  };

  const getPriorityLabel = (priority: Priority) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  // Weekly Planner functions
  const getCurrentWeek = () => {
    const today = new Date();
    const monday = startOfWeek(today, { weekStartsOn: 1 }); // 1 = Monday
    const sunday = endOfWeek(today, { weekStartsOn: 1 });
    return { monday, sunday, days: Array.from({ length: 7 }, (_, i) => addDays(monday, i)) };
  };

  // Format week date range (e.g., "January 19 to January 25, 2026")
  const formatWeekDateRange = (): string => {
    const week = getCurrentWeek();
    const mondayDate = format(week.monday, 'MMMM d');
    const sundayDate = format(week.sunday, 'MMMM d');
    const year = format(week.sunday, 'yyyy');
    
    return `${mondayDate} to ${sundayDate}, ${year}`;
  };

  const getDayKey = (date: Date) => format(date, 'yyyy-MM-dd');

  // Format date with ordinal suffix (1st, 2nd, 3rd, etc.)
  const formatDateWithOrdinal = (date: Date): string => {
    const day = date.getDate();
    const month = format(date, 'MMMM');
    const year = date.getFullYear();
    
    const getOrdinalSuffix = (n: number): string => {
      // Handle special cases: 11th, 12th, 13th
      if (n >= 11 && n <= 13) {
        return 'th';
      }
      // Handle last digit
      const lastDigit = n % 10;
      switch (lastDigit) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    
    return `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
  };

  const getDayData = (date: Date): DayData => {
    const key = getDayKey(date);
    return weeklyData.get(key) || { date, tasks: [], focus: null };
  };

  const updateDayData = (date: Date, updates: Partial<DayData>) => {
    const key = getDayKey(date);
    const current = getDayData(date);
    setWeeklyData(new Map(weeklyData.set(key, { ...current, ...updates })));
  };

  const addWeeklyTask = () => {
    if (!newWeeklyTaskText.trim()) {
      toast.error('Please enter a task');
      return;
    }
    const dayData = getDayData(selectedDay);
    const newTask: WeeklyTask = {
      id: Date.now().toString(),
      text: newWeeklyTaskText.trim(),
      completed: false,
      priority: newWeeklyTaskPriority,
    };
    updateDayData(selectedDay, {
      tasks: [...dayData.tasks, newTask],
    });
    setNewWeeklyTaskText('');
    setNewWeeklyTaskPriority('medium');
    if (user?.id) {
      recordActivity(user.id);
    }
  };

  const toggleWeeklyTask = (date: Date, taskId: string) => {
    const dayData = getDayData(date);
    const updatedTasks = dayData.tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    updateDayData(date, { tasks: updatedTasks });
    if (user?.id) {
      const task = dayData.tasks.find(t => t.id === taskId);
      if (task && !task.completed) {
        recordActivity(user.id);
      }
    }
  };

  const deleteWeeklyTask = (date: Date, taskId: string) => {
    const dayData = getDayData(date);
    updateDayData(date, {
      tasks: dayData.tasks.filter(task => task.id !== taskId),
    });
  };

  const clearDay = (date: Date) => {
    updateDayData(date, { tasks: [], focus: null });
  };

  // Initialize weekly data when dialog opens
  useEffect(() => {
    if (!weeklyPlannerOpen || !user?.id) return;
    const week = getCurrentWeek();
    setWeeklyData(prevData => {
      const newData = new Map(prevData);
      week.days.forEach(day => {
        const dayKey = getDayKey(day);
        if (!newData.has(dayKey)) {
          newData.set(dayKey, {
            date: day,
            tasks: [],
            focus: null,
          });
        }
      });
      return newData;
    });
    setSelectedDay(prevDay => {
      const week = getCurrentWeek();
      if (!isSameDay(prevDay, week.days[0])) {
        return week.days[0]; // Select Monday by default
      }
      return prevDay;
    });
  }, [weeklyPlannerOpen, user?.id]);

  // Load weekly data from localStorage
  useEffect(() => {
    if (!user?.id) return;
    const stored = localStorage.getItem(`weekly_planner_${user.id}`);
    if (stored) {
      try {
        const parsed: Record<string, { date: string; tasks: WeeklyTask[]; focus: 'work' | 'learning' | 'personal' | null }> = JSON.parse(stored);
        const dataMap = new Map<string, DayData>();
        Object.entries(parsed).forEach(([key, value]) => {
          dataMap.set(key, {
            ...value,
            date: new Date(value.date),
            tasks: value.tasks || [],
          });
        });
        setWeeklyData(dataMap);
      } catch (error) {
        console.error('Error loading weekly data:', error);
      }
    }
  }, [user?.id]);

  // Save weekly data to localStorage
  useEffect(() => {
    if (!user?.id || weeklyData.size === 0) return;
    const obj: Record<string, { date: string; tasks: WeeklyTask[]; focus: 'work' | 'learning' | 'personal' | null }> = {};
    weeklyData.forEach((value, key) => {
      obj[key] = {
        ...value,
        date: value.date.toISOString(),
      };
    });
    localStorage.setItem(`weekly_planner_${user.id}`, JSON.stringify(obj));
  }, [weeklyData, user?.id]);

  // Set roadmap to show today's day by default, and refresh when weekly data changes
  useEffect(() => {
    const today = new Date();
    // Check if today is in the current week
    const week = getCurrentWeek();
    const todayInWeek = week.days.find(day => isSameDay(day, today));
    if (todayInWeek) {
      setRoadmapSelectedDay(today);
    } else {
      // If today is not in current week, show Monday
      setRoadmapSelectedDay(week.days[0]);
    }
  }, [weeklyData]);


  return (
    <div className="flex-1 flex flex-col">
      {/* Main Content Area */}
      <main className="flex-1 p-5 overflow-y-auto">
          {/* Header Section */}
          <div className="flex flex-wrap items-center justify-between gap-3.5 mb-5">
            <div>
              <h2 className="text-5xl font-black text-foreground tracking-tight animate-bounce-welcome">
                Welcome back, {userName}
              </h2>
              <p className="text-muted-foreground mt-1 font-medium text-xs">
                Here's what's new for you today
              </p>
                          </div>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-green text-green-foreground px-4 py-2 rounded-xl font-bold text-xs shadow-sm">
                <Flame className="w-3 h-3 text-orange-600 fill-orange-600" />
                Daily Streak: {streak} {streak === 1 ? 'Day' : 'Days'}
                    </div>
            <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                    className="h-10 w-10 rounded-xl border-border hover:bg-muted relative"
                >
                  <Bell className="w-4 h-4" />
                  {totalNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[11px] flex items-center justify-center font-medium">
                      {totalNotifications > 9 ? '9+' : totalNotifications}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0" align="end">
                <div className="p-3.5 border-b border-border">
                  <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {totalNotifications === 0 ? (
                    <div className="p-3.5 text-center text-muted-foreground text-xs">
                      No new notifications
                    </div>
                  ) : (
                    <div className="py-2">
                      {unreadMessages > 0 && (
                        <button
                          className="w-full px-3.5 py-2.5 text-left hover:bg-muted/50 flex items-center gap-2.5 border-b border-border/40"
                          onClick={() => {
                            navigate('/messages');
                            setNotificationsOpen(false);
                          }}
                        >
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <MessageSquare className="w-3 h-3 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-foreground">Unread Messages</p>
                            <p className="text-[11px] text-muted-foreground">{unreadMessages} new message{unreadMessages > 1 ? 's' : ''}</p>
                          </div>
                        </button>
                      )}
                      {newBidsOnProjects.map((bid) => (
                        <button
                          key={bid.id}
                          className="w-full px-3 py-2 text-left hover:bg-muted/50 flex items-center gap-2 border-b border-border/40 last:border-b-0"
                          onClick={() => {
                            navigate(`/projects/${bid.user_projects.id}`);
                            setNotificationsOpen(false);
                          }}
                        >
                          <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                            <FileText className="w-3 h-3 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">New bid: ₹{bid.amount}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{bid.user_projects.title}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          </div>

          {/* Daily Motivation & Today's Goal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 mb-5">
            {/* Daily Motivation Card */}
            <Card className="lg:col-span-2 group relative overflow-hidden rounded-xl border border-black/20 shadow-sm p-5 flex flex-col md:flex-row gap-5 items-center bg-[#FDF8F3]">
              <div className="w-full md:w-1/3 aspect-video md:aspect-square bg-cover bg-center rounded-xl shadow-inner bg-gradient-to-br from-orange-200 via-blue-200 to-gray-300">
                {/* Placeholder for motivation image */}
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2.5 mb-3.5 flex-wrap">
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    Daily Motivation
                  </span>
                  <div className="flex items-center gap-1 bg-yellow px-1.5 py-0.5 rounded text-[9px] font-black">
                    <Quote className="w-2.5 h-2.5" />
                    <span className="font-black">QUOTE OF THE DAY</span>
                  </div>
                  <span className="text-[9px] font-bold text-accent-foreground bg-accent px-1.5 py-0.5 rounded">
                    {formatDateWithOrdinal(new Date())}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2.5 leading-tight italic text-foreground">
                  "Success is not final, failure is not fatal: it is the courage to continue that counts."
                </h3>
                <p className="text-muted-foreground text-xs font-medium">— Winston Churchill</p>
                    </div>
            </Card>

            {/* Today's Goal Card */}
            <Card className="bg-[#FDF8F3] rounded-xl border border-black/20 shadow-sm p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-sm">Today's Goal</h4>
                  <Target className="w-3.5 h-3.5 text-primary" />
                  </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <p className="text-xl font-black">{todayGoalProgress}%</p>
                    <p className="text-[11px] text-muted-foreground mb-1">{todayTasksCompleted} of {todayTasksTotal} tasks</p>
                </div>
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${todayGoalProgress}%` }}></div>
              </div>
            </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-4 italic">
                "Focus on the step in front of you, not the whole staircase."
              </p>
            </Card>
          </div>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-5">
            <Card 
              className="bg-[#FDF8F3] p-3.5 rounded-xl border border-black/20 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center text-center gap-2.5"
              onClick={() => navigate('/projects')}
            >
              <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Search className="w-4 h-4" />
                  </div>
              <span className="text-[11px] font-bold text-muted-foreground">Browse Projects</span>
            </Card>
            <Card 
              className="bg-[#FDF8F3] p-3 rounded-xl border border-black/20 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center text-center gap-2"
              onClick={() => navigate('/bids')}
            >
              <div className="size-9 rounded-full bg-secondary/20 text-secondary-foreground flex items-center justify-center">
                <Gavel className="w-4 h-4" />
                </div>
              <span className="text-[11px] font-bold text-muted-foreground">My Bids</span>
            </Card>
            <Card 
              className="bg-[#FDF8F3] p-3 rounded-xl border border-black/20 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center text-center gap-2"
              onClick={() => navigate('/projects')}
            >
              <div className="size-9 rounded-full bg-accent/20 text-accent-foreground flex items-center justify-center">
                <Package className="w-4 h-4" />
                    </div>
              <span className="text-[11px] font-bold text-muted-foreground">Deliverables</span>
            </Card>
            <Card 
              className="bg-[#FDF8F3] p-3 rounded-xl border border-black/20 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center text-center gap-2"
                      onClick={() => navigate('/projects')}
            >
              <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <FileCheck className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-muted-foreground">Contracts</span>
                  </Card>
            <Card 
              className="bg-[#FDF8F3] p-3 rounded-xl border border-black/20 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center text-center gap-2"
              onClick={() => navigate('/buy-credits')}
            >
              <div className="size-9 rounded-full bg-accent/20 text-accent-foreground flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-muted-foreground">Wallet</span>
            </Card>
          </div>

          {/* Suggested for You */}
          <div className="mb-5 w-full">
            <h3 className="text-base font-bold mb-4 flex items-center gap-1.5 animate-fade-in-up">
              <TrendingUp className="w-4 h-4 text-primary animate-pulse-glow" />
              <span>Suggested for you</span>
            </h3>
            <Card className="bg-[#FDF8F3] rounded-xl border border-black/20 shadow-sm p-6 hover:shadow-md transition-all w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestedItems.map((item, idx) => (
                  <div 
                    key={item.id} 
                    className={cn(
                      "bg-white/90 backdrop-blur-sm rounded-xl border border-black/10 p-4 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group relative overflow-hidden",
                      item.animation === "slide-in-left" && "animate-slide-in-left",
                      item.animation === "slide-in-right" && "animate-slide-in-right",
                      item.animation === "bounce-in" && "animate-bounce-in"
                    )}
                    style={{ 
                      animationDelay: `${idx * 0.15}s`
                    }}
                  >
                    {/* Animated background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-150"></div>
                    
                    {/* Floating icon with animation */}
                    <div className="flex items-start gap-3 relative z-10">
                      <div className={cn(
                        "size-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-300 shadow-md group-hover:shadow-lg",
                        item.color,
                        "group-hover:scale-125 group-hover:rotate-12 animate-float"
                      )} style={{ animationDelay: `${idx * 0.2}s` }}>
                        <span className="animate-wiggle" style={{ animationDelay: `${idx * 0.3}s` }}>{item.icon}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Type badge */}
                        <div className="flex items-center gap-2 mb-2">
                          {item.type === "class" ? (
                            <div className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                              <GraduationCap className="w-3 h-3 text-blue-600" />
                              <span className="text-[8px] font-bold text-blue-600 uppercase">Class</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                              <Briefcase className="w-3 h-3 text-orange-600" />
                              <span className="text-[8px] font-bold text-orange-600 uppercase">Project</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-start justify-between mb-2 gap-2">
                          <div className="flex-1">
                            <h5 className="text-sm font-bold text-foreground leading-tight group-hover:text-primary transition-colors mb-1.5 line-clamp-2">
                              {item.title}
                            </h5>
                            <span className={cn(
                              "inline-block text-[9px] font-bold text-white px-2 py-0.5 rounded-full",
                              item.badge === "Best Ratings" 
                                ? "bg-primary" 
                                : item.badge === "Top Recommended"
                                ? "bg-primary"
                                : "bg-accent"
                            )}>
                              {item.badge}
                            </span>
                          </div>
                        </div>

                        {/* Class specific content */}
                        {item.type === "class" && (
                          <>
                            <p className="text-xs text-muted-foreground mb-2.5">by {item.instructor}</p>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-[10px] font-bold text-yellow-700">{item.rating}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{item.duration}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>{item.students?.toLocaleString()}</span>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Project specific content */}
                        {item.type === "project" && (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-muted-foreground">Client: {item.client}</p>
                              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">{item.budget}</span>
                            </div>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                <span>{item.deadline}</span>
                              </div>
                              <div className="flex gap-1 flex-wrap">
                                {item.skills?.map((skill, skillIdx) => (
                                  <span key={skillIdx} className="text-[9px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-md border border-primary/20">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Shimmer effect on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-5">
            <Card className="bg-[#FDF8F3] p-5 rounded-xl border border-black/20 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center mb-3.5">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Current Successful</p>
                <span className="text-accent-foreground text-[11px] font-bold bg-accent px-1.5 py-0.5 rounded-lg">+12%</span>
              </div>
              <div className="flex items-end gap-3.5">
                <p className="text-3xl font-black">{String(stats.successful).padStart(2, '0')}</p>
                <div className="flex-1 h-11 flex items-end gap-1.5">
                  <div className="w-full bg-accent/20 h-1/2 rounded-sm"></div>
                  <div className="w-full bg-accent/20 h-2/3 rounded-sm"></div>
                  <div className="w-full bg-accent/20 h-1/3 rounded-sm"></div>
                  <div className="w-full bg-accent/20 h-3/4 rounded-sm"></div>
                  <div className="w-full bg-accent h-full rounded-sm"></div>
                </div>
              </div>
            </Card>

            <Card className="bg-[#FDF8F3] p-5 rounded-xl border border-black/20 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center mb-3.5">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Ongoing Projects</p>
                <span className="text-primary text-[11px] font-bold bg-primary/5 px-1.5 py-0.5 rounded-lg">Stable</span>
              </div>
              <div className="flex items-end gap-3.5">
                <p className="text-3xl font-black">{String(stats.ongoing).padStart(2, '0')}</p>
                <div className="flex-1 h-11 flex items-end gap-1.5">
                  <div className="w-full bg-primary/20 h-1/2 rounded-sm"></div>
                  <div className="w-full bg-primary/20 h-1/2 rounded-sm"></div>
                  <div className="w-full bg-primary h-1/2 rounded-sm"></div>
                  <div className="w-full bg-primary/20 h-1/2 rounded-sm"></div>
                  <div className="w-full bg-primary/20 h-1/2 rounded-sm"></div>
                </div>
              </div>
            </Card>

            <Card className="bg-[#FDF8F3] p-5 rounded-xl border border-black/20 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center mb-3.5">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Pending Approval</p>
                <span className="text-secondary-foreground text-[11px] font-bold bg-secondary px-1.5 py-0.5 rounded-lg">-2</span>
              </div>
              <div className="flex items-end gap-3.5">
                <p className="text-3xl font-black">{String(stats.pending).padStart(2, '0')}</p>
                <div className="flex-1 h-11 flex items-end gap-1.5">
                  <div className="w-full bg-secondary/20 h-full rounded-sm"></div>
                  <div className="w-full bg-secondary/20 h-3/4 rounded-sm"></div>
                  <div className="w-full bg-secondary h-1/2 rounded-sm"></div>
                  <div className="w-full bg-secondary/20 h-1/3 rounded-sm"></div>
                  <div className="w-full bg-secondary/20 h-1/4 rounded-sm"></div>
                </div>
              </div>
            </Card>
          </div>

          {/* Latest in Tech, Weekly Roadmap, To-Do List & Active Snapshots */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left Column - Latest in Tech, Weekly Roadmap & To-Do List */}
            <div className="lg:col-span-2 space-y-5">
              {/* Latest in Tech */}
              <div>
                <h3 className="text-base font-bold mb-3.5 flex items-center gap-1.5">
                  <Rss className="w-3.5 h-3.5 text-primary" />
                  Latest in Tech
                </h3>
                <Card className="bg-[#FDF8F3] rounded-xl border border-black/20 shadow-sm p-4 h-[200px] overflow-hidden relative">
                  <div className="animate-scroll-up">
                    {/* First set of items */}
                    {techNewsItems.map((item, index) => (
                      <div key={`first-${index}`} className="flex items-center gap-3 py-2 border-b border-black/10 last:border-b-0">
                        <div className={cn("size-5 rounded-full flex items-center justify-center text-[9px] text-white font-bold flex-shrink-0", item.iconBg)}>
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">{item.source}</span>
                            <span className="text-[9px] text-muted-foreground">•</span>
                            <span className="text-[9px] text-muted-foreground">{item.time}</span>
                          </div>
                          <p className="text-xs font-bold leading-tight text-foreground">
                            {item.headline}
                          </p>
                        </div>
                      </div>
                    ))}
                    {/* Duplicate set for seamless loop */}
                    {techNewsItems.map((item, index) => (
                      <div key={`second-${index}`} className="flex items-center gap-3 py-2 border-b border-black/10 last:border-b-0">
                        <div className={cn("size-5 rounded-full flex items-center justify-center text-[9px] text-white font-bold flex-shrink-0", item.iconBg)}>
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">{item.source}</span>
                            <span className="text-[9px] text-muted-foreground">•</span>
                            <span className="text-[9px] text-muted-foreground">{item.time}</span>
                          </div>
                          <p className="text-xs font-bold leading-tight text-foreground">
                            {item.headline}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
                          </div>
                          
              {/* Weekly Roadmap & To-Do List - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Weekly Roadmap */}
                <Card className="bg-[#FDF8F3] rounded-2xl p-6 shadow-sm border border-black/20 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-bold flex-shrink-0">Weekly Roadmap</h3>
                      <span className="text-[9px] font-bold text-accent-foreground bg-accent px-2 py-1 rounded flex-shrink-0 whitespace-nowrap">
                        {formatWeekDateRange()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-1">
                      {getCurrentWeek().days.map((day) => {
                        const dayData = getDayData(day);
                        const dayAbbr = format(day, 'EEE').toUpperCase();
                        const dayNum = format(day, 'd');
                        const isSelected = isSameDay(day, roadmapSelectedDay);
                        const isToday = isSameDay(day, new Date());
                        const hasTasks = dayData.tasks.length > 0;
                        const hasCompletedTasks = dayData.tasks.some(t => t.completed);
                        const allTasksCompleted = dayData.tasks.length > 0 && dayData.tasks.every(t => t.completed);
                        
                        return (
                          <button
                            key={getDayKey(day)}
                            onClick={() => setRoadmapSelectedDay(day)}
                            className="flex flex-col items-center gap-2 group flex-1"
                          >
                            <span className={cn(
                              "text-xs font-bold",
                              isSelected ? "text-primary" : "text-muted-foreground"
                            )}>{dayAbbr}</span>
                            <div className={cn(
                              "w-full aspect-square rounded-lg border flex items-center justify-center transition-colors",
                              isSelected
                                ? "border-2 border-primary bg-primary/5 shadow-sm"
                                : hasCompletedTasks && !allTasksCompleted
                                ? "border-primary/20 bg-primary/5"
                                : "border-dashed border-border bg-muted/50 hover:border-primary/50"
                            )}>
                              {allTasksCompleted ? (
                                <span className="text-sm text-primary">✓</span>
                              ) : hasCompletedTasks ? (
                                <span className="text-sm text-primary">✓</span>
                              ) : isSelected ? (
                                <span className="text-sm text-primary font-bold">✎</span>
                              ) : (
                                <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {/* Display tasks for selected day */}
                    {(() => {
                      const selectedDayData = getDayData(roadmapSelectedDay);
                      return (
                        <div className="mt-4 space-y-1.5 min-h-[54px]">
                          {selectedDayData.tasks.length > 0 ? (
                            <div className="space-y-1">
                              {selectedDayData.tasks.slice(0, 3).map((task) => (
                                <div key={task.id} className="flex items-center gap-1.5 text-[11px]">
                                  <Checkbox
                                    checked={task.completed}
                                    className="w-2.5 h-2.5"
                                    disabled
                                  />
                                  <span className={cn(
                                    "flex-1 text-[11px]",
                                    task.completed ? "line-through text-muted-foreground" : "text-foreground"
                                  )}>
                                    {task.text}
                                  </span>
                                </div>
                              ))}
                              {selectedDayData.tasks.length > 3 && (
                                <p className="text-[11px] text-muted-foreground">+{selectedDayData.tasks.length - 3} more</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-[11px] text-muted-foreground italic">No tasks for {format(roadmapSelectedDay, 'EEEE')}</p>
                          )}
                        </div>
                      );
                    })()}
                    <div className="mt-6 border-t border-border pt-3">
                      <button
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary hover:gap-2 transition-all"
                        onClick={() => setWeeklyPlannerOpen(true)}
                      >
                        Plan your week
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </Card>

                {/* To-Do List */}
                <Card className="bg-[#FDF8F3] rounded-2xl p-6 shadow-sm border border-black/20 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <CheckSquare2 className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-bold">To-Do List</h3>
                    </div>
                    <Dialog open={addTaskDialogOpen} onOpenChange={setAddTaskDialogOpen}>
                      <DialogTrigger asChild>
                          <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-primary text-primary text-xs font-bold hover:bg-primary/5"
                          >
                          <Plus className="w-4 h-4" />
                          Add Task
                          </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>New Task</DialogTitle>
                        </DialogHeader>
                        <Separator className="my-4" />
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <Label htmlFor="task" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Task Name
                            </Label>
                            <Input
                              id="task"
                              placeholder="What needs to be done?"
                              value={newTaskText}
                              onChange={(e) => setNewTaskText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddTask();
                                }
                              }}
                              className="rounded-lg"
                              autoFocus
                            />
                  </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Priority
                            </Label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant={newTaskPriority === 'low' ? 'default' : 'outline'}
                                onClick={() => setNewTaskPriority('low')}
                                className={cn(
                                  "rounded-lg flex-1",
                                  newTaskPriority === 'low'
                                    ? "bg-accent text-accent-foreground hover:bg-accent/90 dark:bg-accent dark:text-accent-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80 dark:bg-muted dark:text-muted-foreground"
                                )}
                              >
                                Low
                              </Button>
                              <Button
                                type="button"
                                variant={newTaskPriority === 'medium' ? 'default' : 'outline'}
                                onClick={() => setNewTaskPriority('medium')}
                                className={cn(
                                  "rounded-lg flex-1",
                                  newTaskPriority === 'medium'
                                    ? "bg-secondary text-secondary-foreground hover:bg-secondary/90 dark:bg-secondary dark:text-secondary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80 dark:bg-muted dark:text-muted-foreground"
                                )}
                              >
                                Medium
                              </Button>
                              <Button
                                type="button"
                                variant={newTaskPriority === 'high' ? 'default' : 'outline'}
                                onClick={() => setNewTaskPriority('high')}
                                className={cn(
                                  "rounded-lg flex-1",
                                  newTaskPriority === 'high'
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80 dark:bg-muted dark:text-muted-foreground"
                                )}
                              >
                                High
                              </Button>
            </div>
                </div>
                          <div className="flex justify-end gap-2 pt-2">
                    <Button 
                              variant="ghost"
                              onClick={() => {
                                setAddTaskDialogOpen(false);
                                setNewTaskText('');
                                setNewTaskPriority('medium');
                              }}
                              className="text-gray-700 dark:text-gray-300"
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleAddTask}
                              className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              Add Task
                    </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="flex-1 space-y-px bg-muted rounded-xl overflow-hidden max-h-[220px] overflow-y-auto">
                    {todos.length === 0 ? (
                      <div className="p-5 bg-[#FDF8F3] text-center text-sm text-muted-foreground">
                        No tasks yet. Add one to get started!
                  </div>
                ) : (
                      todos.map((todo, index) => (
                        <div
                          key={todo.id}
                          className={cn(
                            "flex items-center gap-3 p-3 bg-[#FDF8F3]",
                            index < todos.length - 1 && "border-b border-border"
                          )}
                        >
                          <Checkbox
                            checked={todo.completed}
                            onCheckedChange={() => toggleTodo(todo.id)}
                            className="size-4 rounded text-primary"
                          />
                          <span
                            className={cn(
                              "text-sm font-medium flex-1",
                              todo.completed
                                ? "text-muted-foreground line-through decoration-muted-foreground"
                                : "text-foreground"
                            )}
                          >
                            {todo.text}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-medium px-2 py-1 rounded",
                              getPriorityBadge(todo.priority)
                            )}
                          >
                            {getPriorityLabel(todo.priority)}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>

            </div>

            {/* Right Column - Active Snapshots */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-primary" />
                  Active Snapshots
                </h3>
                <span className="text-[11px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-lg">
                  {activeProjects.length} Active
                </span>
              </div>
              <div className="space-y-2.5">
                {activeProjects.length > 0 ? (
                  activeProjects.map((project) => {
                    const deadline = project.bidding_deadline 
                      ? new Date(project.bidding_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : null;
                    const isOverdue = deadline && new Date(project.bidding_deadline) < new Date();
                        
                        return (
                      <Card key={project.id} className="bg-[#FDF8F3] p-4.5 rounded-xl border border-black/20 shadow-sm group">
                        <div className="flex justify-between items-start mb-3.5">
                          <div>
                            <h4 className="font-bold text-sm mb-1">{project.title}</h4>
                            <p className="text-[11px] text-muted-foreground font-medium">Status: {project.status}</p>
                              </div>
                          {deadline && (
                            <div className="flex flex-col items-end">
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                                Deadline
                              </span>
                            <span className={cn(
                                "text-xs font-bold",
                                isOverdue ? "text-red-500" : "text-foreground"
                            )}>
                                {deadline}
                            </span>
                          </div>
                          )}
                    </div>
                    <Button 
                          className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-xs transition-all hover:shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-1.5"
                          onClick={() => navigate(`/projects/${project.id}`)}
                    >
                          Open Project
                          <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
              </Card>
                    );
                  })
                ) : (
                  <Card className="bg-[#FDF8F3] p-5 rounded-xl border border-black/20 shadow-sm">
                    <p className="text-muted-foreground text-center py-3.5 text-xs">No active projects at the moment</p>
                  </Card>
                )}
          </div>
            </div>
          </div>

          {/* Earnings & Profit Analytics - Full Width */}
          <div className="mb-5 w-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-primary" />
                Earnings & Profit
              </h3>
            </div>
            <Card className="bg-[#FDF8F3] rounded-xl border border-black/20 shadow-sm p-5 w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Earnings */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-black/10 p-4 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-muted-foreground uppercase">Total Earnings</span>
                    </div>
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-2xl font-black text-primary">₹2,45,000</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">+18.5%</span>
                    <span className="text-[10px] text-muted-foreground">vs last month</span>
                  </div>
                </div>

                {/* Net Profit */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-black/10 p-4 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-lg bg-accent/20 text-accent-foreground flex items-center justify-center">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-muted-foreground uppercase">Net Profit</span>
                    </div>
                    <BarChart3 className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <p className="text-2xl font-black text-accent">₹1,87,500</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold text-accent-foreground bg-accent/20 px-2 py-0.5 rounded-full">76.5%</span>
                    <span className="text-[10px] text-muted-foreground">profit margin</span>
                  </div>
                </div>

                {/* Average per Project */}
                <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 rounded-xl border border-black/10 p-4 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-bold text-muted-foreground uppercase">Avg. per Project</span>
                      <p className="text-2xl font-black text-foreground mt-1">₹20,417</p>
                    </div>
                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
      </main>

      {/* Weekly Planner Dialog */}
      <Dialog open={weeklyPlannerOpen} onOpenChange={setWeeklyPlannerOpen}>
        <DialogContent className="max-w-3xl h-[85vh] p-0 bg-[#faf7f1] overflow-hidden [&>button]:hidden" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="flex flex-col h-full min-h-0">
              {/* Header */}
            <div className="px-5 py-3.5 border-b border-gray-200/60 bg-white flex justify-between items-start flex-shrink-0">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <h2 className="text-xl font-black tracking-tight text-[#121118]">Plan Your Week</h2>
                  {(() => {
                    const week = getCurrentWeek();
                    return (
                      <Badge className="bg-secondary text-[#121118] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {format(week.monday, 'MMM d')} — {format(week.sunday, 'MMM d')}
                      </Badge>
                    );
                  })()}
              </div>
                <p className="text-gray-500 font-medium text-xs">Add your key tasks for each day. Keep it simple.</p>
              </div>
                <button 
                onClick={() => setWeeklyPlannerOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-0 flex-shrink">
              {/* Left Column - Select Day & Week Overview */}
              <div className="lg:col-span-5 p-5 border-r border-gray-200/60 bg-gray-50/30">
                {/* Select Day */}
                <div className="mb-7">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3.5">Select Day</h3>
                  <div className="flex justify-between gap-1.5">
                    {getCurrentWeek().days.map((day) => {
                      const dayData = getDayData(day);
                      const isSelected = isSameDay(day, selectedDay);
                      const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                      const hasTasks = dayData.tasks.length > 0;
                  return (
                    <button 
                          key={getDayKey(day)}
                          onClick={() => {
                            setSelectedDay(day);
                            setSelectedFocus(dayData.focus || 'work');
                          }}
                      className={cn(
                            "flex-1 aspect-square rounded-xl flex flex-col items-center justify-center gap-1 shadow-md transition-colors",
                            isSelected
                              ? "bg-primary text-white shadow-primary/20"
                              : "bg-white border border-gray-200 text-[#121118] hover:border-primary/40"
                          )}
                        >
                          <span className={cn(
                            "text-[9px] font-bold uppercase opacity-80",
                            !isSelected && isWeekend && "text-red-400",
                            !isSelected && !isWeekend && "text-gray-400"
                          )}>
                            {format(day, 'EEE')}
                          </span>
                          <span className="text-base font-black">{format(day, 'd')}</span>
                          {hasTasks && (
                            <div className="size-1.5 bg-accent rounded-full" />
                          )}
                    </button>
                  );
                })}
              </div>
            </div>

                {/* Week Overview */}
                <div>
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3.5">Week Overview</h3>
                  <div className="space-y-3.5">
                    {getCurrentWeek().days.map((day) => {
                      const dayData = getDayData(day);
                      const dayName = format(day, 'EEEE').toUpperCase();
                      const isSelected = isSameDay(day, selectedDay);
                      return (
                        <div key={getDayKey(day)} className="bg-white/60 p-3.5 rounded-xl border border-gray-100">
                          <p className={cn(
                            "text-[11px] font-bold mb-1.5",
                            isSelected ? "text-primary" : "text-gray-400"
                          )}>
                            {dayName}
                          </p>
                          {dayData.tasks.length > 0 ? (
                            <ul className="space-y-1">
                              {dayData.tasks.slice(0, 2).map((task) => (
                                <li key={task.id} className="text-[11px] font-medium text-gray-600 flex items-center gap-1.5">
                                  <span className="size-1 bg-accent rounded-full" />
                                  <span className={cn(task.completed && "line-through text-gray-400")}>
                                    {task.text}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[11px] font-medium text-gray-400 italic">No tasks scheduled yet...</p>
                          )}
                  </div>
                      );
                    })}
                </div>
                </div>
              </div>

              {/* Right Column - Daily Plan */}
              <div className="lg:col-span-7 p-5">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-5">
                    <h4 className="text-lg font-bold">{format(selectedDay, 'EEEE, MMM d')}</h4>
                    {(() => {
                      const dayData = getDayData(selectedDay);
                  return (
                        <span className="px-2.5 py-0.5 bg-gray-100 rounded-full text-[9px] font-bold text-gray-500 uppercase">
                          {dayData.tasks.length} {dayData.tasks.length === 1 ? 'Task' : 'Tasks'}
                        </span>
                      );
                    })()}
                        </div>

                  <div className="space-y-5">
                    {/* Add Task */}
                    <div className="space-y-2.5">
                      <div className="relative">
                        <Input
                          placeholder="Add a task..."
                          value={newWeeklyTaskText}
                          onChange={(e) => setNewWeeklyTaskText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addWeeklyTask();
                            }
                          }}
                          className="w-full pl-3.5 pr-11 py-2.5 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-primary/20 placeholder:text-gray-400"
                        />
                        <button
                          onClick={addWeeklyTask}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg shadow-primary/20"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        </div>
                        </div>

                    {/* Task List */}
                    <div className="space-y-1.5">
                      {getDayData(selectedDay).tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-3.5 p-2.5 hover:bg-gray-50 rounded-xl transition-colors group">
                          <GripVertical className="text-gray-300 cursor-grab active:cursor-grabbing w-3.5 h-3.5" />
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => toggleWeeklyTask(selectedDay, task.id)}
                            className="w-4 h-4 rounded-md"
                          />
                          <span className={cn(
                            "flex-1 text-xs font-medium",
                            task.completed ? "line-through text-gray-400" : "text-gray-800"
                          )}>
                            {task.text}
                              </span>
                          <Badge
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                              task.priority === 'high' && "bg-orange-100 text-orange-600",
                              task.priority === 'medium' && "bg-blue-100 text-blue-600",
                              task.priority === 'low' && "bg-accent/30 text-accent-foreground"
                            )}
                          >
                            {task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Mid' : 'Low'}
                          </Badge>
                          <button
                            onClick={() => deleteWeeklyTask(selectedDay, task.id)}
                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          </div>
                      ))}
                    </div>

                    <Separator className="border-gray-100" />

                    {/* Focus for Day */}
                    <div>
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-2.5">Focus for Day</label>
                      <div className="flex gap-1.5">
                        {(['work', 'learning', 'personal'] as const).map((focus) => {
                          const dayData = getDayData(selectedDay);
                          const isSelected = dayData.focus === focus || (!dayData.focus && focus === 'work');
                          return (
                            <Button
                              key={focus}
                              type="button"
                              onClick={() => {
                                updateDayData(selectedDay, { focus });
                                setSelectedFocus(focus);
                              }}
                              className={cn(
                                "flex-1 py-1.5 text-[10px] font-bold rounded-lg shadow-sm",
                                isSelected
                                  ? "bg-primary text-white"
                                  : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                              )}
                            >
                              {focus.charAt(0).toUpperCase() + focus.slice(1)}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 bg-white border-t border-gray-200/60 flex items-center justify-between flex-shrink-0">
              <button
                onClick={() => clearDay(selectedDay)}
                className="text-xs font-bold text-red-400 hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Clear day
              </button>
              <div className="flex gap-3.5">
                        <Button 
                  variant="outline"
                  onClick={() => {
                    // Save draft functionality
                    toast.success('Draft saved');
                  }}
                  className="px-5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all"
                >
                  Save Draft
                </Button>
                <Button
                  onClick={() => {
                    // Save week plan functionality - data is already saved to localStorage via useEffect
                    // Force roadmap to refresh by updating the selected day
                    const today = new Date();
                    const week = getCurrentWeek();
                    const todayInWeek = week.days.find(day => isSameDay(day, today));
                    if (todayInWeek) {
                      setRoadmapSelectedDay(today);
                    } else {
                      setRoadmapSelectedDay(week.days[0]);
                    }
                    toast.success('Week plan saved successfully');
                    setWeeklyPlannerOpen(false);
                  }}
                  className="px-7 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all active:translate-y-0"
                >
                  Save Week Plan
                </Button>
                      </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
  );
};

export default DashboardPage;
