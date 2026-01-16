import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, IndianRupee, FileText, CheckCircle2, XCircle, Clock, Coins, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

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

interface CreditTransaction {
  id: string;
  amount: number;
  balance_after: number;
  transaction_type: string;
  notes: string | null;
  created_at: string;
}

export default function BidsPage() {
  const { user } = useAuth();
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [receivedBids, setReceivedBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);

  useEffect(() => {
    if (user) {
      fetchBids();
      fetchCreditInfo();
    }
  }, [user]);

  const fetchCreditInfo = async () => {
    if (!user) return;
    
    try {
      // Fetch credit balance
      const { data: balanceData, error: balanceError } = await supabase.rpc('get_freelancer_credit_balance', {
        _user_id: user.id
      });
      
      if (balanceError) throw balanceError;
      setCreditBalance(balanceData || 0);

      // Fetch recent transactions
      const { data: txData, error: txError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (txError) throw txError;
      setCreditTransactions(txData || []);
    } catch (error) {
      console.error('Error fetching credit info:', error);
    }
  };

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

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'admin_grant':
        return <Badge className="bg-green-500/10 text-green-700 border-green-200 text-xs">Admin Grant</Badge>;
      case 'admin_deduct':
        return <Badge className="bg-red-500/10 text-red-700 border-red-200 text-xs">Admin Deduct</Badge>;
      case 'bid_placed':
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-200 text-xs">Bid Placed</Badge>;
      case 'signup_bonus':
        return <Badge className="bg-purple-500/10 text-purple-700 border-purple-200 text-xs">Signup Bonus</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{type}</Badge>;
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
        {/* Header with Credit Card */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Bids</h1>
              <p className="text-muted-foreground">Manage your bids and proposals</p>
            </div>
            
            {/* Credit Balance Card - Colorful */}
            <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-primary via-accent-purple to-accent-blue min-w-[220px] overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-5 relative">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    <Coins className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white/80 font-medium">Credit Balance</p>
                    <p className="text-3xl font-bold text-white">{creditBalance}</p>
                  </div>
                </div>
                <p className="text-xs text-white/70 mt-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                  10 credits per bid
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="my-bids" className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-3 h-12 bg-muted/50 p-1 rounded-xl mb-8">
            <TabsTrigger 
              value="my-bids"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent-purple data-[state=active]:text-white data-[state=active]:shadow-md font-medium"
            >
              My Bids ({myBids.length})
            </TabsTrigger>
            <TabsTrigger 
              value="received"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent-purple data-[state=active]:text-white data-[state=active]:shadow-md font-medium"
            >
              Received ({receivedBids.length})
            </TabsTrigger>
            <TabsTrigger 
              value="history"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent-purple data-[state=active]:text-white data-[state=active]:shadow-md font-medium"
            >
              Credit History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-bids" className="mt-6">
            {myBids.length === 0 ? (
              <Card className="rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-accent-purple/5">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No bids yet</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Browse projects and submit proposals to get started.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {myBids.filter((bid) => bid.user_projects !== null).map((bid, index) => {
                  const cardColors = ['border-l-4 border-l-primary', 'border-l-4 border-l-accent-purple', 'border-l-4 border-l-accent-blue', 'border-l-4 border-l-green'];
                  return (
                    <Card key={bid.id} className={`rounded-2xl hover:shadow-lg transition-all ${cardColors[index % cardColors.length]}`}>
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
                            <div className="flex items-center gap-2 bg-green/20 px-3 py-1.5 rounded-lg">
                              <IndianRupee className="w-4 h-4 text-green-foreground" />
                              <span className="font-bold text-green-foreground">₹{bid.amount}</span>
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
                  );
                })}
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
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Recent Credit Transactions
                </CardTitle>
                <CardDescription>
                  Your last 10 credit transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {creditTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Coins className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No transactions yet</h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      Your credit transactions will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {creditTransactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          {tx.amount > 0 ? (
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                          )}
                          <div>
                            {getTransactionBadge(tx.transaction_type)}
                            {tx.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{tx.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Balance: {tx.balance_after}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tx.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
