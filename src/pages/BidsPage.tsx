import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, IndianRupee, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Bid {
  id: string;
  project_id: string;
  freelancer_id: string;
  amount: number;
  proposal: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  user_projects: {
    title: string;
    description: string;
    user_id: string;
  };
  user_profiles?: {
    first_name: string;
    last_name: string;
  };
}

export default function BidsPage() {
  const { user } = useAuth();
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [receivedBids, setReceivedBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBids();
    }
  }, [user]);

  const fetchBids = async () => {
    if (!user) return;

    try {
      // Fetch bids I made
      const { data: myBidsData, error: myBidsError } = await supabase
        .from('bids')
        .select(`
          *,
          user_projects (
            title,
            description,
            user_id
          )
        `)
        .eq('freelancer_id', user.id)
        .order('created_at', { ascending: false });

      if (myBidsError) throw myBidsError;

      // Fetch bids on my projects
      const { data: myProjectsData, error: myProjectsError } = await supabase
        .from('user_projects')
        .select('id')
        .eq('user_id', user.id);

      if (myProjectsError) throw myProjectsError;

      const projectIds = myProjectsData?.map(p => p.id) || [];

      let receivedBidsData: Bid[] = [];
      if (projectIds.length > 0) {
        const { data: bidsData, error } = await supabase
          .from('bids')
          .select(`
            *,
            user_projects (
              title,
              description,
              user_id
            )
          `)
          .in('project_id', projectIds)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch profiles for all freelancers
        if (bidsData && bidsData.length > 0) {
          const freelancerIds = bidsData.map(b => b.freelancer_id);
          const { data: profilesData, error: profilesError } = await supabase
            .from('user_profiles')
            .select('user_id, first_name, last_name')
            .in('user_id', freelancerIds);

          if (profilesError) throw profilesError;

          // Map profiles to bids
          receivedBidsData = bidsData.map(bid => ({
            ...bid,
            user_profiles: profilesData?.find(p => p.user_id === bid.freelancer_id)
          })) as Bid[];
        }
      }

      setMyBids(myBidsData || []);
      setReceivedBids(receivedBidsData);
    } catch (error: any) {
      console.error('Error fetching bids:', error);
      toast.error('Failed to load bids');
    } finally {
      setLoading(false);
    }
  };

  const updateBidStatus = async (bidId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('bids')
        .update({ status })
        .eq('id', bidId);

      if (error) throw error;

      toast.success(`Bid ${status}`);
      fetchBids();
    } catch (error: any) {
      console.error('Error updating bid:', error);
      toast.error('Failed to update bid status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-500/10 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Accepted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <main className="flex-1 p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading bids...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Bids</h1>
          <p className="text-muted-foreground mt-2">Manage your bids and proposals</p>
        </div>

        <Tabs defaultValue="my-bids" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="my-bids">My Bids ({myBids.length})</TabsTrigger>
            <TabsTrigger value="received">Received ({receivedBids.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="my-bids" className="mt-6">
            {myBids.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No bids yet</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Browse projects and submit proposals to get started.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {myBids.filter((bid) => bid.user_projects !== null).map((bid) => (
                  <Card key={bid.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{bid.user_projects.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {bid.user_projects.description}
                          </CardDescription>
                        </div>
                        {getStatusBadge(bid.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <IndianRupee className="w-4 h-4" />
                            <span className="font-semibold text-foreground">₹{bid.amount}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-border">
                          <h4 className="font-semibold text-sm text-foreground mb-2">Your Proposal</h4>
                          <p className="text-sm text-muted-foreground">{bid.proposal}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="received" className="mt-6">
            {receivedBids.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No bids received</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    When freelancers bid on your projects, they'll appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {receivedBids.filter((bid) => bid.user_projects !== null).map((bid) => (
                  <Card key={bid.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{bid.user_projects.title}</CardTitle>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-muted-foreground">From:</span>
                            <span className="text-sm font-semibold text-foreground">
                              {bid.user_profiles?.first_name} {bid.user_profiles?.last_name}
                            </span>
                          </div>
                        </div>
                        {getStatusBadge(bid.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <IndianRupee className="w-4 h-4" />
                            <span className="font-semibold text-foreground">₹{bid.amount}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-border">
                          <h4 className="font-semibold text-sm text-foreground mb-2">Proposal</h4>
                          <p className="text-sm text-muted-foreground">{bid.proposal}</p>
                        </div>
                        {bid.status === 'pending' && (
                          <div className="flex gap-2 pt-4">
                            <Button
                              onClick={() => updateBidStatus(bid.id, 'accepted')}
                              className="flex-1"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Accept
                            </Button>
                            <Button
                              onClick={() => updateBidStatus(bid.id, 'rejected')}
                              variant="outline"
                              className="flex-1"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
