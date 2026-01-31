import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAdminRole } from '@/hooks/useAdminRole';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronDown, Bell, MessageSquare, FileText, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  user_type?: string | null;
  avatar_url?: string | null;
}

export const DashboardLayout = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isVerifiedStudent, setIsVerifiedStudent] = useState(false);
  const { isAdmin } = useAdminRole();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
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

  // Public routes that don't require authentication
  const publicRoutes = ['/projects'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  useEffect(() => {
    // Only redirect to login if not on a public route and user is not authenticated
    if (!loading && !user && !isPublicRoute) {
      navigate('/login');
    }
  }, [user, loading, navigate, isPublicRoute]);

  // Fetch unread message count
  const { data: unreadCount } = useQuery({
    queryKey: ['unreadMessages', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', user.id);

      if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

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

          // Check verification status
          const { data: verification } = await supabase
            .from('student_verifications')
            .select('verification_status')
            .eq('user_id', user.id)
            .maybeSingle();

          setIsVerifiedStudent(verification?.verification_status === 'approved');
        } catch (error) {
          console.error('Error fetching profile:', error);
        } finally {
          setProfileLoading(false);
        }
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
    const interval = setInterval(fetchNotifications, 30000); // Refetch every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Show loading only if not on public route or if checking auth
  if (loading || (user && profileLoading)) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // For public routes without auth, render without sidebar
  if (!user && isPublicRoute) {
    return (
      <div className="min-h-screen w-full bg-background">
        <Outlet />
      </div>
    );
  }

  // For authenticated users or protected routes, show with sidebar
  if (!user) {
    return null;
  }

  const displayName = profile ? `${profile.first_name} ${profile.last_name}` : 'User';
  const displayEmail = user.email || 'No email';
  const isClient = profile?.user_type === 'non-student';

  const freelancerLinks = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Project', to: '/projects' },
    { label: 'Community', to: '/community' },
    { label: 'Buy Credits', to: '/buy-credits' },
    { label: 'Message', to: '/messages' },
  ];

  const clientLinks = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Project', to: '/projects' },
    { label: 'Message', to: '/messages' },
  ];

  const navLinks = isClient ? clientLinks : freelancerLinks;

  const initials =
    profile?.first_name || profile?.last_name
      ? `${(profile.first_name || '')?.[0] || ''}${(profile.last_name || '')?.[0] || ''}`.toUpperCase()
      : (user.email || 'U')[0]?.toUpperCase();

  const totalNotifications = unreadMessages + newBidsOnProjects.length;

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Top Navbar – transparent glass with primary/secondary gradient like reference */}
      <header
        className="sticky top-0 z-30 w-full border-b border-white/20 backdrop-blur-xl bg-white/80"
      >
        <div className="mx-auto flex h-24 items-center px-4 sm:px-6">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center flex-shrink-0">
            <img
              src="/images/theunoia-logo.png"
              alt="Theunoia logo"
              className="h-8 w-auto"
            />
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-6 ml-8">
            {navLinks.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'text-sm font-semibold text-black relative transition-colors',
                    'hover:text-black',
                    'after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300',
                    'hover:after:w-full'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Large Space */}
          <div className="flex-1" />

          {/* Search Bar */}
          <div className="flex items-center">
            <div className="flex items-center bg-white border border-gray-300 rounded-l-md px-4 h-10">
              <Input
                type="text"
                placeholder="What service are you looking for today?"
                className="h-full border-0 bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400 w-80"
              />
            </div>
            <Button
              type="button"
              className="h-10 px-4 bg-primary hover:bg-primary/90 rounded-r-md rounded-l-none border-0 flex items-center justify-center"
            >
              <Search className="w-5 h-5 text-primary-foreground" />
            </Button>
          </div>

          {/* Notification Button */}
          <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 ml-4 relative"
              >
                <Bell className="w-5 h-5" />
                {totalNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
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

          {/* Profile Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="ml-4 flex items-center gap-1.5"
              >
                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-md hover:bg-gray-50">
                  <User className="w-4 h-4 text-foreground transition-transform duration-300" />
                </div>
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">
                {displayName}
                <div className="text-[10px] text-muted-foreground truncate">
                  {displayEmail}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {!isClient && (
                <DropdownMenuItem onClick={() => navigate('/bids')}>
                  My Bids
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => navigate('/calendar')}>
                Calendar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                Profile
              </DropdownMenuItem>
              {!isClient && (
                <DropdownMenuItem onClick={() => navigate('/leadership')}>
                  Leadership Board
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main
        className={cn(
          'w-full min-h-screen',
          location.pathname === '/messages' ? '' : location.pathname === '/leadership' ? 'p-0' : 'p-6 pt-4',
          (location.pathname === '/profile' || location.pathname === '/leadership') && 'bg-[#faf7f1]'
        )}
      >
        <Outlet />
      </main>
    </div>
  );
};
