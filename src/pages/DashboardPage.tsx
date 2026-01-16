import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Bell, Plus, MessageSquare, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { PROJECT_CATEGORIES, getCategoryList } from '@/data/categories';
import { cn } from '@/lib/utils';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [latestProjects, setLatestProjects] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [myBids, setMyBids] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newBidsOnProjects, setNewBidsOnProjects] = useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error) throw error;
          setProfile(data);
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
    };

    const fetchActiveProjects = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('user_projects')
          .select(`
            *,
            bids(count)
          `)
          .eq('user_id', user.id)
          .eq('project_type', 'work_requirement')
          .in('status', ['open', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(4);

        if (error) throw error;
        setActiveProjects(data || []);
      } catch (error) {
        console.error('Error fetching active projects:', error);
      }
    };

    const fetchMyBids = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('bids')
          .select(`
            *,
            user_projects(title)
          `)
          .eq('freelancer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setMyBids(data || []);
      } catch (error) {
        console.error('Error fetching my bids:', error);
      }
    };

    const fetchLatestProjects = async () => {
      try {
        let query = supabase
          .from('user_projects')
          .select('*')
          .eq('project_type', 'work_requirement')
          .eq('status', 'open')
          .eq('is_community_task', false);
        
        if (selectedCategory && selectedCategory !== "all") {
          query = query.eq('category', selectedCategory);
        }
        
        const { data, error } = await query
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        setLatestProjects(data || []);
      } catch (error) {
        console.error('Error fetching latest projects:', error);
      }
    };

    fetchProfile();
    fetchActiveProjects();
    fetchMyBids();
    fetchLatestProjects();
  }, [user, selectedCategory]);

  // Handle search
  useEffect(() => {
    const searchProjects = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('user_projects')
          .select('*')
          .eq('project_type', 'work_requirement')
          .eq('status', 'open')
          .eq('is_community_task', false)
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%,subcategory.ilike.%${searchQuery}%`)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (error) {
        console.error('Error searching projects:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchProjects, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

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

  const totalNotifications = unreadMessages + newBidsOnProjects.length;
  const firstName = profile?.first_name || 'User';

  return (
    <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap px-10 py-6 bg-background border-b border-border/60">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search projects, skills, or categories..."
                className="pl-12 h-12 rounded-2xl border-border/60 text-[0.9375rem] shadow-sm bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {/* Search Results Dropdown */}
              {searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-muted-foreground">Searching...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">No projects found</div>
                  ) : (
                    <div className="py-2">
                      {searchResults.map((project) => (
                        <button
                          key={project.id}
                          className="w-full px-4 py-3 text-left hover:bg-muted/50 flex flex-col gap-1 border-b border-border/40 last:border-b-0"
                          onClick={() => {
                            navigate(`/projects/${project.id}`);
                            setSearchQuery("");
                          }}
                        >
                          <span className="font-medium text-foreground line-clamp-1">{project.title}</span>
                          <div className="flex items-center gap-2">
                            {project.category && (
                              <span className="text-xs text-primary">{project.category}</span>
                            )}
                            {project.budget && (
                              <span className="text-xs text-muted-foreground">₹{project.budget}</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-full border-border/60 hover:bg-muted/30 shadow-sm relative"
                >
                  <Bell className="w-5 h-5" />
                  {totalNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
                      {totalNotifications > 9 ? '9+' : totalNotifications}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {totalNotifications === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No new notifications
                    </div>
                  ) : (
                    <div className="py-2">
                      {unreadMessages > 0 && (
                        <button
                          className="w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center gap-3 border-b border-border/40"
                          onClick={() => {
                            navigate('/messages');
                            setNotificationsOpen(false);
                          }}
                        >
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">Unread Messages</p>
                            <p className="text-xs text-muted-foreground">{unreadMessages} new message{unreadMessages > 1 ? 's' : ''}</p>
                          </div>
                        </button>
                      )}
                      {newBidsOnProjects.map((bid) => (
                        <button
                          key={bid.id}
                          className="w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center gap-3 border-b border-border/40 last:border-b-0"
                          onClick={() => {
                            navigate(`/projects/${bid.user_projects.id}`);
                            setNotificationsOpen(false);
                          }}
                        >
                          <div className="h-9 w-9 rounded-full bg-green-500/10 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">New bid: ₹{bid.amount}</p>
                            <p className="text-xs text-muted-foreground truncate">{bid.user_projects.title}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Button 
              onClick={() => navigate('/projects?create=true')}
              className="h-11 px-6 rounded-2xl bg-foreground text-background hover:bg-foreground/90 shadow-sm gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[0.9375rem]">New Project</span>
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-10 bg-background overflow-y-auto">
          {/* Welcome Section - Colorful & Playful */}
          <div className="relative mb-8 px-2">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-accent-purple to-accent-blue p-8 md:p-10">
              {/* Decorative shapes */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-1/4 w-24 h-24 bg-green/40 rounded-full blur-xl translate-y-1/2" />
              <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-yellow/50 rounded-full blur-lg" />
              
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex flex-col gap-3">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium w-fit">
                      <span className="w-2 h-2 bg-green rounded-full animate-pulse" />
                      Dashboard
                    </span>
                    <h1 className="text-white text-4xl md:text-5xl font-bold tracking-tight">
                      Welcome back, {firstName}! 👋
                    </h1>
                    <p className="text-white/80 text-lg font-normal max-w-xl">
                      Ready to make things happen? Here's what's cooking on your dashboard today.
                    </p>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="flex gap-4 flex-wrap">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 min-w-[120px]">
                      <p className="text-white/70 text-sm font-medium">Active Projects</p>
                      <p className="text-white text-3xl font-bold">{activeProjects.length}</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 min-w-[120px]">
                      <p className="text-white/70 text-sm font-medium">My Bids</p>
                      <p className="text-white text-3xl font-bold">{myBids.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Projects & My Bids */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-2">
            {/* Active Projects */}
            <div className="lg:col-span-2">
              <section>
                <div className="flex items-center gap-3 pb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-foreground text-xl font-semibold">Active Projects</h2>
                </div>
                {activeProjects.length === 0 ? (
                  <Card className="flex flex-col gap-4 p-8 rounded-2xl shadow-sm border-2 border-dashed border-primary/30 text-center bg-gradient-to-br from-primary/5 to-accent-purple/5">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Plus className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground">No active projects yet</p>
                    <Button 
                      onClick={() => navigate('/projects')}
                      className="mx-auto bg-gradient-to-r from-primary to-accent-purple text-white hover:opacity-90"
                    >
                      Post Your First Project
                    </Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {activeProjects.map((project, index) => {
                      const bidCount = project.bids?.[0]?.count || 0;
                      const statusBadge = project.status === 'open' ? 'New Bids' : 'In Progress';
                      const statusColor = project.status === 'open' ? 'bg-secondary text-secondary-foreground' : 'bg-green text-green-foreground';
                      const cardColors = [
                        'border-l-4 border-l-primary',
                        'border-l-4 border-l-secondary',
                        'border-l-4 border-l-green',
                        'border-l-4 border-l-accent-blue'
                      ];
                      
                      return (
                        <Card key={project.id} className={cn("flex flex-col gap-4 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 bg-card", cardColors[index % 4])}>
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1.5 flex-1 pr-2">
                              <p className="text-foreground text-[1.0625rem] font-semibold leading-tight line-clamp-1">
                                {project.title}
                              </p>
                              <p className="text-muted-foreground text-[0.8125rem] font-normal">
                                Posted {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                            <span className={cn("px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap shadow-sm", statusColor)}>
                              {statusBadge}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1">
                              {[...Array(Math.min(bidCount, 3))].map((_, i) => (
                                <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-purple to-primary border-2 border-white" />
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {bidCount} {bidCount === 1 ? 'bid' : 'bids'} received
                            </span>
                          </div>
                          
                          {project.budget && (
                            <div className="flex items-center gap-2 bg-green/20 rounded-lg px-3 py-2 w-fit">
                              <span className="text-sm text-green-foreground font-medium">Budget:</span>
                              <span className="text-lg font-bold text-green-foreground">₹{project.budget}</span>
                            </div>
                          )}
                          
                          <Button 
                            className="mt-2 rounded-xl bg-gradient-to-r from-primary to-accent-purple text-white hover:opacity-90 font-medium text-[0.9375rem] shadow-sm"
                            onClick={() => navigate(`/projects/${project.id}`)}
                          >
                            View Project Details
                          </Button>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* My Bids Sidebar */}
            <aside className="lg:col-span-1">
              <div className="flex items-center gap-3 pb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-yellow flex items-center justify-center">
                  <Bell className="w-5 h-5 text-secondary-foreground" />
                </div>
                <h2 className="text-foreground text-xl font-semibold">My Bids</h2>
              </div>
              <Card className="flex flex-col gap-4 p-6 rounded-2xl shadow-sm bg-gradient-to-br from-secondary/10 via-card to-yellow/5 border-secondary/30">
                {myBids.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-secondary/20 flex items-center justify-center mb-4">
                      <Search className="w-7 h-7 text-secondary-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm mb-4">No bids placed yet</p>
                    <Button 
                      size="sm"
                      onClick={() => navigate('/projects')}
                      className="bg-gradient-to-r from-secondary to-yellow text-secondary-foreground hover:opacity-90"
                    >
                      Browse Projects
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-3">
                      {myBids.slice(0, 5).map((bid, index) => {
                        const statusColors: Record<string, string> = {
                          accepted: 'bg-green text-green-foreground',
                          pending: 'bg-secondary text-secondary-foreground',
                          rejected: 'bg-destructive/20 text-destructive'
                        };
                        const statusIcons: Record<string, string> = {
                          accepted: '✓',
                          pending: '⏳',
                          rejected: '✕'
                        };
                        
                        return (
                          <div key={bid.id} className="flex justify-between items-center gap-2 p-3 bg-white/60 rounded-xl hover:bg-white/80 transition-colors">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                                index % 3 === 0 ? 'bg-primary/20 text-primary' :
                                index % 3 === 1 ? 'bg-accent-blue/30 text-accent-blue-foreground' :
                                'bg-green/30 text-green-foreground'
                              )}>
                                {(index + 1).toString().padStart(2, '0')}
                              </div>
                              <p className="text-foreground font-medium text-sm line-clamp-1">
                                {bid.user_projects?.title || 'Project'}
                              </p>
                            </div>
                            <span className={cn(
                              "px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap flex items-center gap-1",
                              statusColors[bid.status] || 'bg-muted/60 text-muted-foreground'
                            )}>
                              <span>{statusIcons[bid.status]}</span>
                              {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <Button 
                      className="mt-2 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium text-[0.9375rem]"
                      onClick={() => navigate('/projects?tab=my-projects')}
                    >
                      View All Bids →
                    </Button>
                  </>
                )}
              </Card>
            </aside>
          </div>

          {/* Recommended For You */}
          <section className="mt-10">
            <div className="px-2 pb-6">
              {/* Header */}
              <div className="flex items-center gap-3 pb-6">
                <h2 className="text-foreground text-[1.375rem] font-bold tracking-tight">Recommended For You</h2>
              </div>
              
              {/* Category Pills */}
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => setSelectedCategory("all")}
                  className={cn(
                    "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[0.9375rem] font-medium transition-all duration-200",
                    selectedCategory === "all" 
                      ? "bg-gradient-to-r from-primary to-accent-purple text-white" 
                      : "bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-border/60"
                  )}
                >
                  <span>🎯</span>
                  All Categories
                </button>
                
                {getCategoryList().map((category) => {
                  const categoryEmojis: Record<string, string> = {
                    'Writing & Content': '✍️',
                    'Design & Creative': '⚡',
                    'Web, Tech & Development': '🚀',
                    'Social Media & Digital Marketing': '🌟',
                    'Video, Audio & Multimedia': '🌟',
                    'Virtual Assistance & Admin': '🔥',
                    'Education & Tutoring': '⚡',
                    'AI & Automation': '🚀',
                    'Music, Audio & Performing Arts': '🌟',
                    'Art & Illustration': '🌟',
                    'E-commerce & Online Business': '🔥',
                    'Student-Friendly Services': '⚡',
                    'Beginner Tech & STEM Freelancing': '🚀',
                    'Medical Writing & Editing': '🌟',
                    'Medical Research & Analytics': '🌟',
                    'Clinical Services': '🔥',
                  };
                  const emoji = categoryEmojis[category] || '✨';
                  
                  return (
                    <button 
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={cn(
                        "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[0.9375rem] font-medium transition-all duration-200",
                        selectedCategory === category 
                          ? "bg-gradient-to-r from-primary to-accent-purple text-white" 
                          : "bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-border/60"
                      )}
                    >
                      <span>{emoji}</span>
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Latest Project Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
              {latestProjects.length === 0 ? (
                <div className="col-span-3 text-center py-12">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-primary/20 to-accent-purple/20 flex items-center justify-center mb-4">
                    <span className="text-4xl">🔍</span>
                  </div>
                  <p className="text-muted-foreground text-lg">No projects available at the moment</p>
                  <p className="text-muted-foreground/70 text-sm mt-2">Check back soon for new opportunities!</p>
                </div>
              ) : (
                latestProjects.map((project, index) => {
                  const gradientColors = [
                    'from-primary via-accent-purple to-accent-blue',
                    'from-secondary via-yellow to-green',
                    'from-accent-blue via-primary to-accent-purple'
                  ];
                  
                  return (
                    <Card key={project.id} className="group flex flex-col gap-4 p-0 rounded-2xl shadow-sm hover:shadow-xl transition-all hover:-translate-y-2 overflow-hidden border-0 bg-card">
                      {project.cover_image_url ? (
                        <div className="w-full h-44 overflow-hidden relative">
                          <img src={project.cover_image_url} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        </div>
                      ) : project.image_url ? (
                        <div className="w-full h-44 overflow-hidden relative">
                          <img src={project.image_url} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        </div>
                      ) : (
                        <div className={cn("w-full h-44 bg-gradient-to-br relative overflow-hidden", gradientColors[index % 3])}>
                          <div className="absolute top-4 right-4 w-16 h-16 bg-white/20 rounded-full blur-xl" />
                          <div className="absolute bottom-4 left-4 w-12 h-12 bg-white/20 rounded-full blur-lg" />
                        </div>
                      )}
                      <div className="flex flex-col gap-3 flex-grow p-5 pt-0">
                        <p className="text-foreground text-lg font-bold leading-tight line-clamp-2 -mt-2">
                          {project.title}
                        </p>
                        {(project.category || project.subcategory) && (
                          <div className="flex gap-2 flex-wrap">
                            {project.category && (
                              <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-primary/20 to-accent-purple/20 text-primary">
                                {project.category}
                              </span>
                            )}
                            {project.subcategory && (
                              <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-secondary text-secondary-foreground">
                                {project.subcategory}
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-muted-foreground text-sm font-normal line-clamp-2">
                          {project.description}
                        </p>
                        {project.skills_required && project.skills_required.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {project.skills_required.slice(0, 3).map((skill: string, skillIndex: number) => {
                              const skillColors = ['bg-accent-blue/30 text-accent-blue-foreground', 'bg-green/30 text-green-foreground', 'bg-accent-purple/30 text-accent-purple-foreground'];
                              return (
                                <span key={skillIndex} className={cn("px-2.5 py-1 text-xs font-medium rounded-lg", skillColors[skillIndex % 3])}>
                                  {skill}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {project.budget && (
                          <div className="flex items-center gap-2 mt-2 bg-green/15 rounded-lg px-3 py-2 w-fit">
                            <span className="text-green-foreground font-bold text-lg">₹{project.budget}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-5 pt-0">
                        <Button 
                          className="w-full rounded-xl bg-gradient-to-r from-foreground to-foreground/80 text-background hover:opacity-90 shadow-sm font-semibold text-[0.9375rem] h-11"
                          onClick={() => navigate(`/projects/${project.id}`)}
                        >
                          View Details →
                        </Button>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </section>
        </main>
      </div>
  );
};

export default DashboardPage;
