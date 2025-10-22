import React from 'react';
import { Search, Bell, Plus, Grid3X3, Briefcase, Gavel, Mail, User, Settings, LogOut, CircleArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';

const DashboardPage = () => {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border p-6 flex flex-col justify-between">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="size-9 bg-primary rounded-xl flex items-center justify-center">
              <CircleArrowRight className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-foreground text-xl font-bold">THEUNOiA</h2>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-3">
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-primary-light text-primary font-semibold"
            >
              <Grid3X3 className="w-5 h-5" />
              <p className="text-sm">Dashboard</p>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-primary-light/50 text-muted-foreground hover:text-primary font-medium transition-colors"
            >
              <Briefcase className="w-5 h-5" />
              <p className="text-sm">Projects</p>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-primary-light/50 text-muted-foreground hover:text-primary font-medium transition-colors"
            >
              <Gavel className="w-5 h-5" />
              <p className="text-sm">Bids</p>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-primary-light/50 text-muted-foreground hover:text-primary font-medium transition-colors"
            >
              <Mail className="w-5 h-5" />
              <p className="text-sm">Messages</p>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-primary-light/50 text-muted-foreground hover:text-primary font-medium transition-colors"
            >
              <User className="w-5 h-5" />
              <p className="text-sm">Profile</p>
            </a>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-4">
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-primary-light/50 text-muted-foreground hover:text-primary font-medium transition-colors"
          >
            <Settings className="w-5 h-5" />
            <p className="text-sm">Settings</p>
          </a>
          <div className="border-t border-border my-2"></div>
          <div className="flex items-center gap-3">
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 bg-gradient-to-br from-primary to-accent" />
            <div className="flex flex-col">
              <h1 className="text-foreground text-sm font-semibold">Jane Doe</h1>
              <p className="text-muted-foreground text-xs">janedoe@email.com</p>
            </div>
            <button className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap px-10 py-5 bg-background border-b border-border">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search projects, students, or skills..."
                className="pl-12 h-12 rounded-xl border-border"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-full border-border hover:bg-primary-light/50"
            >
              <Bell className="w-5 h-5" />
            </Button>
            <Button className="h-11 px-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm gap-2">
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8 bg-background overflow-y-auto">
          {/* Welcome Section */}
          <div className="flex flex-col gap-6 px-4 pb-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-foreground text-3xl font-bold">Welcome back, Jane!</p>
                <p className="text-muted-foreground text-base font-normal">
                  Here's what's happening on your dashboard today.
                </p>
              </div>
            </div>
          </div>

          {/* Active Projects & My Bids */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4">
            {/* Active Projects */}
            <div className="lg:col-span-2">
              <section>
                <h2 className="text-foreground text-xl font-semibold px-1 pb-4">Active Projects</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Project Card 1 */}
                  <Card className="flex flex-col gap-4 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1.5">
                        <p className="text-foreground text-lg font-semibold leading-tight">
                          E-commerce Website Redesign
                        </p>
                        <p className="text-muted-foreground text-sm font-normal">Posted 2 days ago</p>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-secondary/50 text-secondary-foreground">
                        New Bids
                      </span>
                    </div>
                    <div className="flex items-center gap-2 -space-x-2">
                      <div className="w-8 h-8 rounded-full border-2 border-background bg-gradient-to-br from-primary to-accent" />
                      <div className="w-8 h-8 rounded-full border-2 border-background bg-gradient-to-br from-accent-blue to-primary" />
                      <div className="w-8 h-8 rounded-full border-2 border-background bg-gradient-to-br from-accent-purple to-accent" />
                      <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                        +5
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span className="font-semibold text-foreground">65%</span>
                      </div>
                      <Progress value={65} className="h-2 bg-muted" />
                    </div>
                    <Button variant="secondary" className="mt-2 bg-primary-light text-primary hover:bg-primary-light/80">
                      View Project Details
                    </Button>
                  </Card>

                  {/* Project Card 2 */}
                  <Card className="flex flex-col gap-4 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1.5">
                        <p className="text-foreground text-lg font-semibold leading-tight">
                          Full-Stack Web App
                        </p>
                        <p className="text-muted-foreground text-sm font-normal">Posted 1 week ago</p>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-muted/50 text-muted-foreground">
                        Reviewing
                      </span>
                    </div>
                    <div className="flex items-center gap-2 -space-x-2">
                      <div className="w-8 h-8 rounded-full border-2 border-background bg-gradient-to-br from-accent to-accent-blue" />
                      <div className="w-8 h-8 rounded-full border-2 border-background bg-gradient-to-br from-accent-purple to-primary" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span className="font-semibold text-foreground">20%</span>
                      </div>
                      <Progress value={20} className="h-2 bg-muted" />
                    </div>
                    <Button variant="secondary" className="mt-2 bg-primary-light text-primary hover:bg-primary-light/80">
                      View Project Details
                    </Button>
                  </Card>
                </div>
              </section>
            </div>

            {/* My Bids Sidebar */}
            <aside className="lg:col-span-1">
              <h2 className="text-foreground text-xl font-semibold px-1 pb-4">My Bids</h2>
              <Card className="flex flex-col gap-4 p-6 shadow-sm">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <p className="text-foreground font-semibold">Logo Design</p>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-green/60 text-green-foreground">
                      Accepted
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-foreground font-semibold">Social Media Mngmt.</p>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-secondary/60 text-secondary-foreground">
                      Pending
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-foreground font-semibold">React Native App</p>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      Rejected
                    </span>
                  </div>
                </div>
                <Button variant="outline" className="mt-2 border-border hover:bg-muted/20">
                  View All Bids
                </Button>
              </Card>
            </aside>
          </div>

          {/* Recommended For You */}
          <section className="mt-8">
            <div className="px-4 pb-4">
              <h2 className="text-foreground text-xl font-semibold pb-4">Recommended For You</h2>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Writing & Content
                </Button>
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:bg-primary-light/50 hover:text-primary">
                  Design & Creative
                </Button>
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:bg-primary-light/50 hover:text-primary">
                  Tech & Development
                </Button>
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:bg-primary-light/50 hover:text-primary">
                  Social Media & Marketing
                </Button>
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:bg-primary-light/50 hover:text-primary">
                  Video & Multimedia
                </Button>
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:bg-primary-light/50 hover:text-primary">
                  Virtual Assistance
                </Button>
              </div>
            </div>

            {/* Recommended Project Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
              {/* Project Card 1 */}
              <Card className="flex flex-col gap-4 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-full h-40 bg-gradient-to-br from-primary via-accent-purple to-accent rounded-lg" />
                <div className="flex flex-col gap-2 flex-grow">
                  <p className="text-foreground text-lg font-semibold leading-tight">
                    Brand Identity for Startup
                  </p>
                  <p className="text-muted-foreground text-sm font-normal">
                    A fresh startup in the fintech space is looking for a complete brand identity package.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green/60 text-green-foreground">
                      Graphic Design
                    </span>
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-accent-blue/50 text-accent-blue-foreground">
                      Illustration
                    </span>
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-accent-purple/50 text-accent-purple-foreground">
                      Branding
                    </span>
                  </div>
                </div>
                <Button className="mt-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                  Place Bid
                </Button>
              </Card>

              {/* Project Card 2 */}
              <Card className="flex flex-col gap-4 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-full h-40 bg-gradient-to-br from-accent-blue via-accent to-secondary rounded-lg" />
                <div className="flex flex-col gap-2 flex-grow">
                  <p className="text-foreground text-lg font-semibold leading-tight">SEO Blog Content</p>
                  <p className="text-muted-foreground text-sm font-normal">
                    We need engaging and SEO-friendly blog posts for our established tech blog.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-secondary/60 text-secondary-foreground">
                      Content Writing
                    </span>
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-primary-light/70 text-primary">
                      SEO
                    </span>
                  </div>
                </div>
                <Button className="mt-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                  Place Bid
                </Button>
              </Card>

              {/* Project Card 3 */}
              <Card className="flex flex-col gap-4 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-full h-40 bg-gradient-to-br from-accent via-accent-blue to-primary rounded-lg" />
                <div className="flex flex-col gap-2 flex-grow">
                  <p className="text-foreground text-lg font-semibold leading-tight">
                    Mobile App UI/UX Design
                  </p>
                  <p className="text-muted-foreground text-sm font-normal">
                    Looking for a talented designer to create an intuitive and beautiful mobile app interface.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green/60 text-green-foreground">
                      UI/UX
                    </span>
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-accent-blue/50 text-accent-blue-foreground">
                      Mobile App
                    </span>
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-accent-purple/50 text-accent-purple-foreground">
                      Figma
                    </span>
                  </div>
                </div>
                <Button className="mt-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                  Place Bid
                </Button>
              </Card>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
