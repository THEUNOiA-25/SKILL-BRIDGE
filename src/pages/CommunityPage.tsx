import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, Calendar, DollarSign, MapPin, Mail } from "lucide-react";
import { toast } from "sonner";

interface College {
  id: string;
  name: string;
  short_name: string;
  city: string;
  state: string;
}

interface CommunityMember {
  user_id: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  profile_picture_url: string | null;
}

interface CommunityTask {
  id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  subcategory: string | null;
  bidding_deadline: string | null;
  cover_image_url: string | null;
  user_id: string;
  created_at: string;
}

export default function CommunityPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userCollege, setUserCollege] = useState<College | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [tasks, setTasks] = useState<CommunityTask[]>([]);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCommunityData();
    }
  }, [user]);

  const fetchCommunityData = async () => {
    try {
      // Check verification status and get college
      const { data: verification, error: verError } = await supabase
        .from('student_verifications')
        .select('verification_status, college_id, colleges(id, name, short_name, city, state)')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (verError) {
        console.error('Error fetching verification:', verError);
        toast.error("Failed to load verification data");
        setLoading(false);
        return;
      }

      if (!verification || verification.verification_status !== 'approved') {
        setIsVerified(false);
        setLoading(false);
        return;
      }

      setIsVerified(true);
      setUserCollege(verification.colleges as any);

      // Fetch community members (verified students from same college)
      const { data: membersData, error: membersError } = await supabase
        .from('student_verifications')
        .select('user_id, user_profiles(user_id, first_name, last_name, bio, profile_picture_url)')
        .eq('college_id', verification.college_id)
        .eq('verification_status', 'approved')
        .neq('user_id', user?.id);

      if (!membersError && membersData) {
        const formattedMembers = membersData
          .filter(m => m.user_profiles)
          .map(m => m.user_profiles as any);
        setMembers(formattedMembers);
      }

      // Fetch community tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('user_projects')
        .select('*')
        .eq('is_community_task', true)
        .eq('community_college_id', verification.college_id)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (!tasksError && tasksData) {
        setTasks(tasksData as any);
      }
    } catch (error) {
      console.error('Error fetching community data:', error);
      toast.error("Failed to load community data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading community...</p>
        </div>
      </div>
    );
  }

  if (!isVerified || !userCollege) {
    return (
      <div className="min-h-screen bg-background p-6 ml-64">
        <Card className="max-w-2xl mx-auto mt-12 p-8 text-center">
          <GraduationCap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-3">Verification Required</h2>
          <p className="text-muted-foreground mb-6">
            You need to be a verified student to access the college community features.
            Verify your student status to connect with fellow students from your college.
          </p>
          <Button onClick={() => navigate('/profile/verify')}>
            Verify Student Status
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 ml-64">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary/10 rounded-xl">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{userCollege.name}</h1>
              <p className="text-muted-foreground">
                <MapPin className="inline w-4 h-4 mr-1" />
                {userCollege.city}, {userCollege.state}
              </p>
            </div>
          </div>
          <p className="text-muted-foreground mt-2">
            Connect with fellow students, collaborate on projects, and build together.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{members.length}</p>
                <p className="text-sm text-muted-foreground">Active Members</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{tasks.length}</p>
                <p className="text-sm text-muted-foreground">Open Tasks</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <Button className="w-full" onClick={() => navigate('/projects')}>
              Post Community Task
            </Button>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="tasks">Community Tasks</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-6">
            {tasks.length === 0 ? (
              <Card className="p-12 text-center">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No community tasks yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to post a task that requires physical delivery or on-campus collaboration.
                </p>
                <Button onClick={() => navigate('/projects')}>Post Your First Task</Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.map((task) => (
                  <Card key={task.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/projects/${task.id}`)}>
                    {task.cover_image_url && (
                      <img src={task.cover_image_url} alt={task.title} className="w-full h-48 object-cover" />
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-foreground line-clamp-2">{task.title}</h3>
                        <Badge variant="secondary">Community</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{task.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary font-semibold">
                          <DollarSign className="w-4 h-4" />
                          ₹{task.budget}
                        </div>
                        <Badge variant="outline">{task.category}</Badge>
                      </div>
                      {task.bidding_deadline && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Deadline: {new Date(task.bidding_deadline).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            {members.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No members yet</h3>
                <p className="text-muted-foreground">Invite your college mates to join the platform!</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member) => (
                  <Card key={member.user_id} className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      {member.profile_picture_url ? (
                        <img src={member.profile_picture_url} alt={`${member.first_name} ${member.last_name}`} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold">
                          {member.first_name[0]}{member.last_name[0]}
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-foreground">{member.first_name} {member.last_name}</h4>
                        <Badge variant="secondary" className="text-xs">Student</Badge>
                      </div>
                    </div>
                    {member.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{member.bio}</p>
                    )}
                    <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(`/profile/${member.user_id}`)}>
                      <Mail className="w-4 h-4 mr-2" />
                      View Profile
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
