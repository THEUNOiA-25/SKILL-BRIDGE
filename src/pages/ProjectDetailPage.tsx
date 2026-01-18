import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, IndianRupee, Clock, Calendar, User, CheckCircle2, XCircle, MessageSquare, Images, Tag, Coins, AlertTriangle, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { AgreementDialog } from "@/components/AgreementDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { z } from "zod";
import { ImageGallery } from "@/components/ImageGallery";
import { FileList } from "@/components/FileList";
import { RatingDialog } from "@/components/RatingDialog";

interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  image_url: string | null;
  cover_image_url: string | null;
  additional_images: string[] | null;
  attached_files: any[] | null;
  project_type: 'work_requirement' | 'portfolio_project';
  budget: number | null;
  timeline: string | null;
  skills_required: string[] | null;
  status: string | null;
  created_at: string;
  bidding_deadline: string | null;
  category: string | null;
  subcategory: string | null;
}

interface Bid {
  id: string;
  project_id: string;
  freelancer_id: string;
  amount: number;
  status: string;
  proposal: string;
  created_at: string;
  freelancer?: {
    first_name: string;
    last_name: string;
    profile_picture_url: string | null;
  };
}

const bidSchema = z.object({
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be a positive number"),
  proposal: z.string().trim().min(20, "Proposal must be at least 20 characters").max(3000, "Proposal must be less than 3000 characters"),
});

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isVerifiedStudent, setIsVerifiedStudent] = useState(false);
  const [bidFormData, setBidFormData] = useState({
    amount: "",
    proposal: "",
  });
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [loadingCredits, setLoadingCredits] = useState(true);

  // Rating dialog state
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [acceptedFreelancerId, setAcceptedFreelancerId] = useState<string | null>(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Agreement state
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [agreementDialogOpen, setAgreementDialogOpen] = useState(false);

  useEffect(() => {
    if (user && id) {
      checkVerification();
      fetchProjectDetails();
      fetchBids();
      fetchCreditBalance();
    }
  }, [user, id]);

  const fetchCreditBalance = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase.rpc('get_freelancer_credit_balance', {
        _user_id: user.id
      });
      
      if (error) throw error;
      setCreditBalance(data || 0);
    } catch (error) {
      console.error('Error fetching credit balance:', error);
    } finally {
      setLoadingCredits(false);
    }
  };

  const checkVerification = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('freelancer_access')
        .select('has_access')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      setIsVerifiedStudent(data?.has_access || false);
    } catch (error) {
      console.error('Error checking verification:', error);
    }
  };

  const fetchProjectDetails = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from("user_projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProject(data as Project);
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from("bids")
        .select(`
          *,
          freelancer:user_profiles!bids_freelancer_id_fkey(first_name, last_name, profile_picture_url)
        `)
        .eq("project_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBids(data as any);
    } catch (error) {
      console.error("Error fetching bids:", error);
      toast.error("Failed to load bids");
    }
  };

  const handlePlaceBid = async () => {
    if (!user?.id || !id || !project) {
      toast.error("User not authenticated");
      return;
    }

    // Check credit balance first
    if (creditBalance < 10) {
      toast.error("Insufficient credits. You need 10 credits to place a bid.");
      return;
    }

    try {
      bidSchema.parse(bidFormData);

      // Check minimum bid (80% of project budget)
      const bidAmount = parseFloat(bidFormData.amount);
      const minBid = project.budget ? project.budget * 0.8 : 0;
      if (project.budget && bidAmount < minBid) {
        toast.error(`Minimum bid is ₹${minBid.toFixed(0)} (80% of project budget)`);
        return;
      }

      // Check if user already placed a bid
      const { data: existingBid } = await supabase
        .from("bids")
        .select("id")
        .eq("project_id", id)
        .eq("freelancer_id", user.id)
        .single();

      if (existingBid) {
        toast.error("You have already placed a bid on this project");
        return;
      }

      const { error } = await supabase
        .from("bids")
        .insert({
          project_id: id,
          freelancer_id: user.id,
          amount: parseFloat(bidFormData.amount),
          proposal: bidFormData.proposal.trim(),
          status: 'pending',
        });

      if (error) throw error;
      toast.success("Bid placed successfully! 10 credits deducted.");
      setDialogOpen(false);
      setBidFormData({ amount: "", proposal: "" });
      fetchBids();
      fetchCreditBalance(); // Refresh credit balance
    } catch (error: any) {
      console.error("Error placing bid:", error);
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error.message?.includes('Insufficient credits')) {
        toast.error(error.message);
        fetchCreditBalance();
      } else {
        toast.error("Failed to place bid");
      }
    }
  };

  const handleAcceptBid = async (bidId: string, freelancerId: string) => {
    if (!confirm("Are you sure you want to accept this bid?")) return;

    try {
      // Update bid status
      const { error: bidError } = await supabase
        .from("bids")
        .update({ status: 'accepted' })
        .eq("id", bidId);

      if (bidError) throw bidError;

      // Update project status
      const { error: projectError } = await supabase
        .from("user_projects")
        .update({ status: 'in_progress' })
        .eq("id", id);

      if (projectError) throw projectError;

      // Create conversation between client and freelancer
      const { error: conversationError } = await supabase
        .from("conversations")
        .insert({
          project_id: id,
          client_id: user?.id,
          freelancer_id: freelancerId,
        });

      if (conversationError && conversationError.code !== '23505') { // Ignore duplicate key error
        throw conversationError;
      }

      toast.success("Bid accepted! A conversation has been created.");
      fetchProjectDetails();
      fetchBids();
    } catch (error) {
      console.error("Error accepting bid:", error);
      toast.error("Failed to accept bid");
    }
  };

  const handleRejectBid = async (bidId: string) => {
    if (!confirm("Are you sure you want to reject this bid?")) return;

    try {
      const { error } = await supabase
        .from("bids")
        .update({ status: 'rejected' })
        .eq("id", bidId);

      if (error) throw error;
      toast.success("Bid rejected");
      fetchBids();
    } catch (error) {
      console.error("Error rejecting bid:", error);
      toast.error("Failed to reject bid");
    }
  };

  const handleMarkComplete = async () => {
    if (!project) return;

    // Find the accepted bid to get freelancer_id
    const acceptedBid = bids.find(bid => bid.status === 'accepted');
    if (!acceptedBid) {
      toast.error("No accepted bid found for this project");
      return;
    }

    setAcceptedFreelancerId(acceptedBid.freelancer_id);
    setRatingDialogOpen(true);
  };

  const handleSubmitRating = async (rating: number, feedback: string) => {
    if (!user?.id || !project || !acceptedFreelancerId) return;

    setIsSubmittingRating(true);
    try {
      // Insert rating
      const { error: ratingError } = await supabase
        .from("freelancer_ratings")
        .insert({
          project_id: project.id,
          freelancer_id: acceptedFreelancerId,
          client_id: user.id,
          rating,
          feedback: feedback || null,
        });

      if (ratingError) throw ratingError;

      // Update project status
      const { error: projectError } = await supabase
        .from("user_projects")
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq("id", project.id);

      if (projectError) throw projectError;

      toast.success("Project completed and rating submitted!");
      setRatingDialogOpen(false);
      setAcceptedFreelancerId(null);
      fetchProjectDetails();
      fetchBids();
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Failed to submit rating");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 p-8 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading project details...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="flex-1 p-8 bg-background">
        <div className="max-w-5xl mx-auto">
          <Card className="rounded-2xl border-border/40">
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">Project Not Found</h3>
              <p className="text-muted-foreground mb-6">The project you're looking for doesn't exist</p>
              <Button onClick={() => navigate('/projects')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const isProjectOwner = user?.id === project.user_id;
  const biddingClosed = project.bidding_deadline ? new Date(project.bidding_deadline) < new Date() : false;
  const canPlaceBid = isVerifiedStudent && !isProjectOwner && project.status === 'open' && !biddingClosed;
  const userAlreadyBid = bids.some(bid => bid.freelancer_id === user?.id);

  return (
    <main className="flex-1 p-8 bg-background">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/projects')} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Button>

        {/* Project Header */}
        <Card className="rounded-2xl border-border/40">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{project.title}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Posted {format(new Date(project.created_at), "MMM d, yyyy")}</span>
                  </div>
                  <Badge variant={project.status === 'open' ? 'default' : project.status === 'in_progress' ? 'secondary' : 'outline'}>
                    {project.status}
                  </Badge>
                </div>
              </div>
              {canPlaceBid && !userAlreadyBid && creditBalance >= 10 && (
                <>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <IndianRupee className="w-4 h-4" />
                        Place Bid
                        <Badge variant="secondary" className="ml-1 text-xs">
                          <Coins className="w-3 h-3 mr-1" />
                          10 credits
                        </Badge>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-background">
                      <DialogHeader>
                        <DialogTitle>Place Your Bid</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        {/* Credit Balance Info */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-primary" />
                            <span className="text-sm">Your Credit Balance</span>
                          </div>
                          <Badge variant="default">{creditBalance} credits</Badge>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-700">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm">Placing this bid will cost 10 credits</span>
                        </div>
                        <div>
                          <Label htmlFor="bid-amount">Bid Amount (₹)</Label>
                          <Input
                            id="bid-amount"
                            type="number"
                            placeholder="Enter your bid amount"
                            value={bidFormData.amount}
                            onChange={(e) => setBidFormData({ ...bidFormData, amount: e.target.value })}
                            className="mt-1"
                            min={project?.budget ? Math.ceil(project.budget * 0.8) : 0}
                          />
                          {project?.budget && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Minimum bid: ₹{Math.ceil(project.budget * 0.8)} (80% of ₹{project.budget} budget)
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="bid-proposal">Proposal</Label>
                          <Textarea
                            id="bid-proposal"
                            placeholder="Describe why you're the best fit for this project..."
                            value={bidFormData.proposal}
                            onChange={(e) => setBidFormData({ ...bidFormData, proposal: e.target.value })}
                            className="mt-1 min-h-[150px]"
                            maxLength={3000}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {bidFormData.proposal.length}/3000 characters
                          </p>
                        </div>
                        {/* Freelancer Agreement Checkbox */}
                        <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                          <Checkbox
                            id="freelancer-agreement"
                            checked={agreementAccepted}
                            onCheckedChange={(checked) => setAgreementAccepted(checked === true)}
                          />
                          <div className="flex-1">
                            <label htmlFor="freelancer-agreement" className="text-sm font-medium cursor-pointer">
                              I agree to the Freelancer Agreement
                            </label>
                            <p className="text-xs text-muted-foreground mt-1">
                              By placing this bid, you agree to abide by THEUNOiA's terms including the 5% commission on project value.
                            </p>
                            <button
                              type="button"
                              onClick={() => setAgreementDialogOpen(true)}
                              className="text-xs text-primary hover:underline mt-1 flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" />
                              Read full agreement
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handlePlaceBid} disabled={!agreementAccepted}>
                            Submit Bid (10 credits)
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <AgreementDialog 
                    open={agreementDialogOpen} 
                    onOpenChange={setAgreementDialogOpen}
                    type="freelancer"
                  />
                </>
              )}
              {canPlaceBid && !userAlreadyBid && creditBalance < 10 && !loadingCredits && (
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="gap-1">
                    <Coins className="w-3 h-3" />
                    Insufficient Credits ({creditBalance}/10)
                  </Badge>
                </div>
              )}
              {biddingClosed && !isProjectOwner && project.status === 'open' && (
                <Badge variant="destructive" className="text-sm">
                  Bidding Closed
                </Badge>
              )}
              {userAlreadyBid && (
                <>
                  <Badge variant="secondary" className="text-sm">
                    You've already placed a bid
                  </Badge>
                  {bids.some(bid => bid.freelancer_id === user?.id && bid.status === 'accepted') && (
                    <Button 
                      onClick={() => navigate('/messages')} 
                      className="gap-2 ml-2"
                      size="sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Go to Chat
                    </Button>
                  )}
                </>
              )}
              {isProjectOwner && project.status === 'in_progress' && (
                <Button
                  onClick={handleMarkComplete}
                  className="gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Complete
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Project Image */}
        {project.cover_image_url && (
          <Card className="rounded-2xl border-border/40 overflow-hidden">
            <img
              src={project.cover_image_url}
              alt={project.title}
              className="w-full h-96 object-cover"
            />
          </Card>
        )}

        {/* Image Gallery */}
        {project.additional_images && project.additional_images.length > 1 && (
          <Card className="rounded-2xl border-border/40 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Images className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Project Gallery</h3>
            </div>
            <ImageGallery
              images={project.additional_images}
              coverImageUrl={project.cover_image_url || undefined}
            />
          </Card>
        )}

        {/* Project Details */}
        <Card className="rounded-2xl border-border/40">
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {project.description}
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(project.category || project.subcategory) && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">Category</h3>
                  </div>
                  <div className="space-y-1">
                    {project.category && (
                      <Badge variant="outline" className="text-sm">
                        {project.category}
                      </Badge>
                    )}
                    {project.subcategory && (
                      <Badge variant="secondary" className="text-sm block w-fit mt-1">
                        {project.subcategory}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              {project.budget && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <IndianRupee className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">Budget</h3>
                  </div>
                  <p className="text-2xl font-bold text-foreground">₹{project.budget}</p>
                </div>
              )}
              {project.timeline && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">Timeline</h3>
                  </div>
                  <p className="text-lg text-foreground">{project.timeline}</p>
                </div>
              )}
              {project.bidding_deadline && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">Bidding Deadline</h3>
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg text-foreground">{format(new Date(project.bidding_deadline), "PPP")}</p>
                    {biddingClosed ? (
                      <Badge variant="destructive" className="text-xs">Closed</Badge>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {Math.ceil((new Date(project.bidding_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">Bids Received</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">{bids.length}</p>
              </div>
            </div>

            {project.skills_required && project.skills_required.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Skills Required</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.skills_required.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
            </>
            )}
          </CardContent>
        </Card>

        {/* Attached Files */}
        {project.attached_files && project.attached_files.length > 0 && (
          <Card className="rounded-2xl border-border/40">
            <CardHeader>
              <CardTitle>Project Files</CardTitle>
            </CardHeader>
            <CardContent>
              <FileList files={project.attached_files} />
            </CardContent>
          </Card>
        )}

        {/* Bids Section - Only visible to project owner */}
        {isProjectOwner && bids.length > 0 && (
          <Card className="rounded-2xl border-border/40">
            <CardHeader>
              <CardTitle>Bids Received ({bids.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {bids.map((bid) => (
                <Card key={bid.id} className="border-border/40">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={bid.freelancer?.profile_picture_url || ''} />
                        <AvatarFallback>
                          {bid.freelancer?.first_name?.[0]}{bid.freelancer?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {bid.freelancer?.first_name} {bid.freelancer?.last_name}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Bid placed {format(new Date(bid.created_at), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-foreground">₹{bid.amount}</p>
                            <Badge 
                              variant={
                                bid.status === 'accepted' ? 'default' : 
                                bid.status === 'rejected' ? 'destructive' : 
                                'secondary'
                              }
                              className="mt-1"
                            >
                              {bid.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="bg-muted rounded-lg p-4">
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {bid.proposal}
                          </p>
                        </div>
                        {bid.status === 'pending' && project.status === 'open' && (
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAcceptBid(bid.id, bid.freelancer_id)}
                              className="gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Accept Bid
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectBid(bid.id)}
                              className="gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </Button>
                          </div>
                        )}
                        {bid.status === 'accepted' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/messages')}
                            className="gap-2"
                          >
                            <MessageSquare className="w-4 h-4" />
                            View Conversation
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* No Bids Message for Project Owner */}
        {isProjectOwner && bids.length === 0 && (
          <Card className="rounded-2xl border-border/40">
            <CardContent className="py-12 text-center">
              <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Bids Yet</h3>
              <p className="text-muted-foreground">Freelancers will see your project and can place bids</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rating Dialog */}
      <RatingDialog
        open={ratingDialogOpen}
        onOpenChange={setRatingDialogOpen}
        onSubmit={handleSubmitRating}
        projectTitle={project?.title || ""}
        isSubmitting={isSubmittingRating}
      />
    </main>
  );
};

export default ProjectDetailPage;
