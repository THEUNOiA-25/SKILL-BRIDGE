import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const DashboardPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

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

    fetchProfile();
  }, [user]);

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Project Card 1 */}
                  <Card className="flex flex-col gap-4 p-6 rounded-2xl shadow-sm border-border/40">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1.5">
                        <p className="text-foreground text-[1.0625rem] font-semibold leading-tight">
                          E-commerce Website Redesign
                        </p>
                        <p className="text-muted-foreground text-[0.8125rem] font-normal">Posted 2 days ago</p>
                      </div>
                      <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-secondary/60 text-secondary-foreground">
                        New Bids
                      </span>
                    </div>
                    <div className="flex items-center gap-2 -space-x-2">
                      <div className="w-9 h-9 rounded-full border-2 border-background bg-gradient-to-br from-primary to-accent shadow-sm" />
                      <div className="w-9 h-9 rounded-full border-2 border-background bg-gradient-to-br from-accent-blue to-primary shadow-sm" />
                      <div className="w-9 h-9 rounded-full border-2 border-background bg-gradient-to-br from-accent-purple to-accent shadow-sm" />
                      <div className="w-9 h-9 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shadow-sm">
                        +5
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[0.8125rem] text-muted-foreground mb-2">
                        <span>Progress</span>
                        <span className="font-semibold text-foreground">65%</span>
                      </div>
                      <Progress value={65} className="h-2.5 bg-muted" />
                    </div>
                    <Button variant="secondary" className="mt-2 rounded-lg bg-primary-light text-primary hover:bg-primary-light/80 font-medium text-[0.9375rem]">
                      View Project Details
                    </Button>
                  </Card>

                  {/* Project Card 2 */}
                  <Card className="flex flex-col gap-4 p-6 rounded-2xl shadow-sm border-border/40">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1.5">
                        <p className="text-foreground text-[1.0625rem] font-semibold leading-tight">
                          Full-Stack Web App
                        </p>
                        <p className="text-muted-foreground text-[0.8125rem] font-normal">Posted 1 week ago</p>
                      </div>
                      <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-muted/60 text-muted-foreground">
                        Reviewing
                      </span>
                    </div>
                    <div className="flex items-center gap-2 -space-x-2">
                      <div className="w-9 h-9 rounded-full border-2 border-background bg-gradient-to-br from-accent to-accent-blue shadow-sm" />
                      <div className="w-9 h-9 rounded-full border-2 border-background bg-gradient-to-br from-accent-purple to-primary shadow-sm" />
                    </div>
                    <div>
                      <div className="flex justify-between text-[0.8125rem] text-muted-foreground mb-2">
                        <span>Progress</span>
                        <span className="font-semibold text-foreground">20%</span>
                      </div>
                      <Progress value={20} className="h-2.5 bg-muted" />
                    </div>
                    <Button variant="secondary" className="mt-2 rounded-lg bg-primary-light text-primary hover:bg-primary-light/80 font-medium text-[0.9375rem]">
                      View Project Details
                    </Button>
                  </Card>
                </div>
              </section>
            </div>

            {/* My Bids Sidebar */}
            <aside className="lg:col-span-1">
              <h2 className="text-foreground text-xl font-semibold pb-5">My Bids</h2>
              <Card className="flex flex-col gap-4 p-6 rounded-2xl shadow-sm border-border/40">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <p className="text-foreground font-semibold text-[0.9375rem]">Logo Design</p>
                    <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-green/60 text-green-foreground">
                      Accepted
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-foreground font-semibold text-[0.9375rem]">Social Media Mngmt.</p>
                    <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-secondary/70 text-secondary-foreground">
                      Pending
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-foreground font-semibold text-[0.9375rem]">React Native App</p>
                    <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      Rejected
                    </span>
                  </div>
                </div>
                <Button variant="outline" className="mt-2 rounded-xl border-border/60 hover:bg-muted/30 font-medium text-[0.9375rem]">
                  View All Bids
                </Button>
              </Card>
            </aside>
          </div>

          {/* Recommended For You */}
          <section className="mt-10">
            <div className="px-2 pb-5">
              <h2 className="text-foreground text-xl font-semibold pb-5">Recommended For You</h2>
              <div className="flex flex-wrap gap-2.5">
                <Button size="sm" className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 text-[0.875rem] font-medium shadow-sm">
                  Writing & Content
                </Button>
                <Button size="sm" variant="ghost" className="rounded-xl text-muted-foreground hover:bg-muted/30 hover:text-foreground h-9 px-4 text-[0.875rem] font-medium">
                  Design & Creative
                </Button>
                <Button size="sm" variant="ghost" className="rounded-xl text-muted-foreground hover:bg-muted/30 hover:text-foreground h-9 px-4 text-[0.875rem] font-medium">
                  Tech & Development
                </Button>
                <Button size="sm" variant="ghost" className="rounded-xl text-muted-foreground hover:bg-muted/30 hover:text-foreground h-9 px-4 text-[0.875rem] font-medium">
                  Social Media & Marketing
                </Button>
                <Button size="sm" variant="ghost" className="rounded-xl text-muted-foreground hover:bg-muted/30 hover:text-foreground h-9 px-4 text-[0.875rem] font-medium">
                  Video & Multimedia
                </Button>
                <Button size="sm" variant="ghost" className="rounded-xl text-muted-foreground hover:bg-muted/30 hover:text-foreground h-9 px-4 text-[0.875rem] font-medium">
                  Virtual Assistance
                </Button>
              </div>
            </div>

            {/* Recommended Project Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 px-2">
              {/* Project Card 1 */}
              <Card className="flex flex-col gap-4 p-6 rounded-2xl shadow-sm border-border/40">
                <div className="w-full h-40 bg-gradient-to-br from-primary via-accent-purple to-accent rounded-xl" />
                <div className="flex flex-col gap-2 flex-grow">
                  <p className="text-foreground text-[1.0625rem] font-semibold leading-tight">
                    Brand Identity for Startup
                  </p>
                  <p className="text-muted-foreground text-[0.875rem] font-normal">
                    A fresh startup in the fintech space is looking for a complete brand identity package.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-green/60 text-green-foreground">
                      Graphic Design
                    </span>
                    <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-accent-blue/50 text-accent-blue-foreground">
                      Illustration
                    </span>
                    <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-accent-purple/50 text-accent-purple-foreground">
                      Branding
                    </span>
                  </div>
                </div>
                <Button className="mt-auto rounded-lg bg-foreground text-background hover:bg-foreground/90 shadow-sm font-medium text-[0.9375rem]">
                  Place Bid
                </Button>
              </Card>

              {/* Project Card 2 */}
              <Card className="flex flex-col gap-4 p-6 rounded-2xl shadow-sm border-border/40">
                <div className="w-full h-40 bg-gradient-to-br from-accent-blue via-accent to-secondary rounded-xl" />
                <div className="flex flex-col gap-2 flex-grow">
                  <p className="text-foreground text-[1.0625rem] font-semibold leading-tight">SEO Blog Content</p>
                  <p className="text-muted-foreground text-[0.875rem] font-normal">
                    We need engaging and SEO-friendly blog posts for our established tech blog.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-secondary/70 text-secondary-foreground">
                      Content Writing
                    </span>
                    <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-primary-light/70 text-primary">
                      SEO
                    </span>
                  </div>
                </div>
                <Button className="mt-auto rounded-lg bg-foreground text-background hover:bg-foreground/90 shadow-sm font-medium text-[0.9375rem]">
                  Place Bid
                </Button>
              </Card>

              {/* Project Card 3 */}
              <Card className="flex flex-col gap-4 p-6 rounded-2xl shadow-sm border-border/40">
                <div className="w-full h-40 bg-gradient-to-br from-accent via-accent-blue to-primary rounded-xl" />
                <div className="flex flex-col gap-2 flex-grow">
                  <p className="text-foreground text-[1.0625rem] font-semibold leading-tight">
                    Mobile App UI/UX Design
                  </p>
                  <p className="text-muted-foreground text-[0.875rem] font-normal">
                    Looking for a talented designer to create an intuitive and beautiful mobile app interface.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-green/60 text-green-foreground">
                      UI/UX
                    </span>
                    <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-accent-blue/50 text-accent-blue-foreground">
                      Mobile App
                    </span>
                    <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-accent-purple/50 text-accent-purple-foreground">
                      Figma
                    </span>
                  </div>
                </div>
                <Button className="mt-auto rounded-lg bg-foreground text-background hover:bg-foreground/90 shadow-sm font-medium text-[0.9375rem]">
                  Place Bid
                </Button>
              </Card>
            </div>
          </section>
        </main>
      </div>
  );
};

export default DashboardPage;
