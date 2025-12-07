import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppSidebar } from '@/components/AppSidebar';
import { useQuery } from '@tanstack/react-query';

export const DashboardLayout = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isVerifiedStudent, setIsVerifiedStudent] = useState(false);

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
            .single();

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

  return (
    <div className="min-h-screen w-full bg-background">
      <AppSidebar
        currentPath={location.pathname}
        displayName={displayName}
        displayEmail={displayEmail}
        profilePictureUrl={profile?.profile_picture_url}
        unreadMessageCount={unreadCount}
        isVerifiedStudent={isVerifiedStudent}
        onSignOut={handleSignOut}
      />
      <main className={`ml-64 ${location.pathname === '/messages' ? '' : 'p-6'}`}>
        <Outlet />
      </main>
    </div>
  );
};
