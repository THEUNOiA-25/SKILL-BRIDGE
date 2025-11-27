import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { PROJECT_CATEGORIES, getCategoryList } from '@/data/categories';
import { cn } from '@/lib/utils';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [latestProjects, setLatestProjects] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [myBids, setMyBids] = useState<any[]>([]);

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
          .eq('status', 'open');
        
        if (selectedCategory) {
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

  const firstName = profile?.first_name || 'User';

  return (
    <div className="flex-1 flex flex-col ml-64">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap px-10 py-6 bg-background border-b border-border/60">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search projects, students, or skills..."
                className="pl-12 h-12 rounded-2xl border-border/60 text-[0.9375rem] shadow-sm bg-white"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-full border-border/60 hover:bg-muted/30 shadow-sm"
            >
              <Bell className="w-5 h-5" />
            </Button>
            <Button className="h-11 px-6 rounded-2xl bg-foreground text-background hover:bg-foreground/90 shadow-sm gap-2 font-medium">
              <Plus className="w-4 h-4" />
              <span className="text-[0.9375rem]">New Project</span>
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-10 bg-background overflow-y-auto">
          {/* Welcome Section */}
          <div className="flex flex-col gap-6 px-2 pb-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-2">
                <p className="text-foreground text-4xl font-bold tracking-tight">Welcome back, {firstName}!</p>
                <p className="text-muted-foreground text-[0.9375rem] font-normal">
                  Here's what's happening on your dashboard today.
                </p>
              </div>
            </div>
          </div>

          {/* Active Projects & My Bids */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-2">
            {/* Active Projects */}
            <div className="lg:col-span-2">
              <section>
                <h2 className="text-foreground text-xl font-semibold pb-5">Active Projects</h2>
                {activeProjects.length === 0 ? (
                  <Card className="flex flex-col gap-4 p-8 rounded-2xl shadow-sm border-border/40 text-center">
                    <p className="text-muted-foreground">No active projects yet</p>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/projects')}
                      className="mx-auto"
                    >
                      Post Your First Project
                    </Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {activeProjects.map((project) => {
                      const bidCount = project.bids?.[0]?.count || 0;
                      const statusBadge = project.status === 'open' ? 'New Bids' : 'In Progress';
                      const statusColor = project.status === 'open' ? 'bg-secondary/60 text-secondary-foreground' : 'bg-green/60 text-green-foreground';
                      
                      return (
                        <Card key={project.id} className="flex flex-col gap-4 p-6 rounded-2xl shadow-sm border-border/40">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1.5 flex-1 pr-2">
                              <p className="text-foreground text-[1.0625rem] font-semibold leading-tight line-clamp-1">
                                {project.title}
                              </p>
                              <p className="text-muted-foreground text-[0.8125rem] font-normal">
                                Posted {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                            <span className={cn("px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap", statusColor)}>
                              {statusBadge}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {bidCount} {bidCount === 1 ? 'bid' : 'bids'} received
                            </span>
                          </div>
                          
                          {project.budget && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Budget:</span>
                              <span className="text-lg font-semibold text-foreground">${project.budget}</span>
                            </div>
                          )}
                          
                          <Button 
                            variant="secondary" 
                            className="mt-2 rounded-lg bg-primary-light text-primary hover:bg-primary-light/80 font-medium text-[0.9375rem]"
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
              <h2 className="text-foreground text-xl font-semibold pb-5">My Bids</h2>
              <Card className="flex flex-col gap-4 p-6 rounded-2xl shadow-sm border-border/40">
                {myBids.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm mb-3">No bids placed yet</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/projects')}
                      className="text-xs"
                    >
                      Browse Projects
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-4">
                      {myBids.slice(0, 5).map((bid) => {
                        const statusColors: Record<string, string> = {
                          accepted: 'bg-green/60 text-green-foreground',
                          pending: 'bg-secondary/70 text-secondary-foreground',
                          rejected: 'bg-red-100 text-red-800'
                        };
                        
                        return (
                          <div key={bid.id} className="flex justify-between items-center gap-2">
                            <p className="text-foreground font-semibold text-[0.9375rem] line-clamp-1 flex-1">
                              {bid.user_projects?.title || 'Project'}
                            </p>
                            <span className={cn(
                              "px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap",
                              statusColors[bid.status] || 'bg-muted/60 text-muted-foreground'
                            )}>
                              {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <Button 
                      variant="outline" 
                      className="mt-2 rounded-xl border-border/60 hover:bg-muted/30 font-medium text-[0.9375rem]"
                      onClick={() => navigate('/projects?tab=my-projects')}
                    >
                      View All Bids
                    </Button>
                  </>
                )}
              </Card>
            </aside>
          </div>

          {/* Recommended For You */}
          <section className="mt-10">
            <div className="px-2 pb-5">
              <h2 className="text-foreground text-xl font-semibold pb-5">Recommended For You</h2>
              <div className="flex flex-wrap gap-2.5">
                <Button 
                  size="sm" 
                  variant={selectedCategory === "" ? "default" : "ghost"}
                  className={cn(
                    "rounded-xl h-9 px-4 text-[0.875rem] font-medium shadow-sm",
                    selectedCategory === "" 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                  )}
                  onClick={() => setSelectedCategory("")}
                >
                  All Categories
                </Button>
                {getCategoryList().map((category) => (
                  <Button 
                    key={category}
                    size="sm" 
                    variant={selectedCategory === category ? "default" : "ghost"}
                    className={cn(
                      "rounded-xl h-9 px-4 text-[0.875rem] font-medium",
                      selectedCategory === category 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" 
                        : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                    )}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Latest Project Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 px-2">
              {latestProjects.length === 0 ? (
                <div className="col-span-3 text-center py-8">
                  <p className="text-muted-foreground">No projects available at the moment</p>
                </div>
              ) : (
                latestProjects.map((project) => (
                  <Card key={project.id} className="flex flex-col gap-4 p-6 rounded-2xl shadow-sm border-border/40">
                    {project.cover_image_url ? (
                      <div className="w-full h-40 rounded-xl overflow-hidden">
                        <img src={project.cover_image_url} alt={project.title} className="w-full h-full object-cover" />
                      </div>
                    ) : project.image_url ? (
                      <div className="w-full h-40 rounded-xl overflow-hidden">
                        <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-primary via-accent-purple to-accent rounded-xl" />
                    )}
                    <div className="flex flex-col gap-2 flex-grow">
                      <p className="text-foreground text-[1.0625rem] font-semibold leading-tight">
                        {project.title}
                      </p>
                      {(project.category || project.subcategory) && (
                        <div className="flex gap-2 flex-wrap">
                          {project.category && (
                            <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                              {project.category}
                            </span>
                          )}
                          {project.subcategory && (
                            <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-secondary/60 text-secondary-foreground">
                              {project.subcategory}
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-muted-foreground text-[0.875rem] font-normal line-clamp-2">
                        {project.description}
                      </p>
                      {project.skills_required && project.skills_required.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {project.skills_required.slice(0, 3).map((skill: string, index: number) => (
                            <span key={index} className="px-3 py-1.5 text-xs font-medium rounded-full bg-secondary/60 text-secondary-foreground">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                      {project.budget && (
                        <p className="text-primary font-semibold text-sm mt-2">
                          Budget: ${project.budget}
                        </p>
                      )}
                    </div>
                    <Button 
                      className="mt-auto rounded-lg bg-foreground text-background hover:bg-foreground/90 shadow-sm font-medium text-[0.9375rem]"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      View Details
                    </Button>
                  </Card>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
  );
};

export default DashboardPage;
