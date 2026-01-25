import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AgreementDialog } from "@/components/AgreementDialog";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { z } from "zod";
import { 
  ArrowLeft, Clock, MapPin, UserPlus, IndianRupee, 
  FileText, CheckCircle2, MapPin as LocationIcon, Calendar,
  Star, Coins, AlertTriangle, FileText as DocIcon,
  Paperclip, Download
} from "lucide-react";
import { recordActivity } from "@/utils/dailyStreak";
import { CollaborationDialog } from "./collaboration/CollaborationDialog";
import projectVideo from "@/assets/Video/New Project 29 [4ED1F2C].mp4";

interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  image_url: string | null;
  cover_image_url: string | null;
  additional_images: string[] | null;
  attached_files: AttachedFile[] | null;
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

interface ClientProfile {
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  city: string | null;
}

interface AttachedFile {
  name: string;
  url: string;
  type: string;
  size?: number;
}

interface Bid {
  id: string;
  freelancer_id: string;
  project_id: string;
  amount: number;
  proposal: string;
  status: string;
  created_at: string;
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
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [leadProfile, setLeadProfile] = useState<{ first_name: string; last_name: string } | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isVerifiedStudent, setIsVerifiedStudent] = useState(false);
  const [bidFormData, setBidFormData] = useState({
    amount: "",
    proposal: "",
  });
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'tracking'>('overview');
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [agreementDialogOpen, setAgreementDialogOpen] = useState(false);
  const [collaborationDialogOpen, setCollaborationDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
      fetchBids();
    }
    if (user && id) {
      checkVerification();
      fetchCreditBalance();
      fetchLeadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  const fetchLeadProfile = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("first_name, last_name")
        .eq("user_id", user.id)
        .single();
      
      if (!error && data) {
        setLeadProfile(data);
      }
    } catch (error) {
      console.error("Error fetching lead profile:", error);
    }
  };

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
      setProject(data as unknown as Project);
      
      // Fetch client profile
      if (data?.user_id) {
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("first_name, last_name, city")
          .eq("user_id", data.user_id)
          .single();
        
        if (!profileError && profileData) {
          setClientProfile(profileData as ClientProfile);
        }
      }
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
      setBids(data || []);
    } catch (error) {
      console.error("Error fetching bids:", error);
    }
  };

  const handlePlaceBid = async () => {
    if (!user?.id || !id || !project) {
      toast.error("Please log in to place a bid");
      navigate('/login');
      return;
    }

    if (creditBalance < 10) {
      toast.error("Insufficient credits. You need 10 credits to place a bid.");
      return;
    }

    try {
      bidSchema.parse(bidFormData);

      const bidAmount = parseFloat(bidFormData.amount);
      const minBid = project.budget ? project.budget * 0.8 : 0;
      if (project.budget && bidAmount < minBid) {
        toast.error(`Minimum bid is ₹${minBid.toFixed(0)} (80% of project budget)`);
        return;
      }

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
      fetchCreditBalance();
      recordActivity(user.id);
    } catch (error: unknown) {
      console.error("Error placing bid:", error);
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to place bid");
      }
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-11 py-10">
          <div className="text-center py-10">
            <p className="text-slate-500 text-sm">Loading project details...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-11 py-10">
          <div className="text-center py-10">
            <h3 className="text-base font-semibold text-slate-900 mb-1.5">Project Not Found</h3>
            <p className="text-slate-500 mb-5 text-sm">The project you're looking for doesn't exist</p>
            <Button onClick={() => navigate('/projects')} className="text-xs">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back to Projects
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const isProjectOwner = user?.id === project.user_id;
  const biddingClosed = project.bidding_deadline ? new Date(project.bidding_deadline) < new Date() : false;
  const canPlaceBid = isVerifiedStudent && !isProjectOwner && project.status === 'open' && !biddingClosed;
  const userAlreadyBid = bids.some((bid: Bid) => bid.freelancer_id === user?.id);
  const projectImage = project.cover_image_url || project.image_url;
  const timeAgo = formatDistanceToNow(new Date(project.created_at), { addSuffix: true });

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-7 py-7">
        {/* Breadcrumb */}
        <div className="mb-6">
          <button 
            onClick={() => navigate('/projects')}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary-purple transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Project
          </button>
        </div>

        {/* Project Header */}
        <div className="mb-7">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4.5">
            <div className="flex-1 max-w-3xl">
              <div className="flex gap-1.5 mb-3.5">
                <span className="px-2 py-0.5 bg-accent-green text-[#052005] text-[9px] font-bold rounded-full flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-[#145214]"></span> {project.status === 'open' ? 'Active Project' : project.status === 'in_progress' ? 'In Progress' : 'Completed'}
                </span>
                {project.category && (
                  <span className="px-2.5 py-0.5 bg-secondary-yellow text-[#73480d] text-[9px] font-extrabold uppercase tracking-widest rounded-full">
                    {project.category}
                  </span>
                )}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 leading-[1.15] mb-3.5">
                {project.title}
              </h1>
              <p className="text-slate-900 font-bold flex flex-wrap items-center gap-3.5 text-xs">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary-purple" />
                  Posted {timeAgo}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary-purple" />
                  Remote / Global
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Tabs and Action Buttons */}
        <div className="mb-7 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div className="inline-flex p-1 bg-slate-50 border border-slate-100 rounded-xl gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-5 py-2 text-[11px] font-bold tracking-wide transition-all rounded-lg ${
                activeTab === 'overview'
                  ? 'bg-primary-purple text-white shadow-md shadow-primary-purple/20'
                  : 'text-slate-900 hover:text-slate-700 bg-transparent'
              }`}
            >
              Project Overview
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`px-5 py-2 text-[11px] font-bold tracking-wide transition-all rounded-lg ${
                activeTab === 'tracking'
                  ? 'bg-primary-purple text-white shadow-md shadow-primary-purple/20'
                  : 'text-slate-900 hover:text-slate-700 bg-transparent'
              }`}
            >
              Project Tracking
            </button>
          </div>
          {!isProjectOwner && (
            <button
              onClick={() => setCollaborationDialogOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary-yellow text-[#73480d] text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <UserPlus className="w-4 h-4 text-[#73480d]" />
              Add Collaborator
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          <div className="lg:col-span-8 flex flex-col gap-7">
            {/* Project Visual */}
            <div className="flex flex-col gap-5">
              <div className="relative w-full max-w-[90%] aspect-[16/9] rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 group">
                <video
                  src={projectVideo}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ objectFit: 'cover', objectPosition: 'center center', transform: 'scale(1.2)' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60"></div>
              </div>

              {/* Project Summary */}
              <div className="grid grid-cols-3 gap-5 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1.5">Estimated Budget</span>
                  <span className="text-lg font-bold text-slate-900">
                    {project.budget ? `₹${project.budget.toLocaleString()}` : 'Negotiable'}
                  </span>
                </div>
                <div className="flex flex-col border-x border-slate-100 px-5">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1.5">Target Deadline</span>
                  <span className="text-lg font-bold text-slate-900">
                    {project.bidding_deadline ? format(new Date(project.bidding_deadline), "d MMM yyyy") : project.timeline || 'Flexible'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1.5">Bids Received</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-bold text-slate-900">{bids.length} Bids</span>
                    <span className="flex h-2 w-2 rounded-full bg-accent-green animate-pulse"></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Brief */}
            <section className="space-y-7">
              <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed text-xs">
                <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2.5">
                  <span className="w-1.5 h-5 bg-secondary-yellow rounded-full"></span>
                  Project Brief
                </h2>
                <div className="whitespace-pre-wrap">{project.description}</div>
              </div>

              {/* Skills and Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-7 pt-5 border-t border-slate-300">
                {project.skills_required && project.skills_required.length > 0 && (
                  <div>
                    <h3 className="text-[11px] font-extrabold uppercase text-slate-900 tracking-[0.2em] mb-3.5">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.skills_required.map((skill, index) => {
                        const colors = [
                          'bg-primary-purple/10 text-primary-purple border-primary-purple/5',
                          'bg-secondary-yellow/20 text-yellow-800 border-secondary-yellow/10',
                          'bg-accent-green/20 text-emerald-800 border-accent-green/10',
                        ];
                        const colorClass = colors[index % colors.length];
                        return (
                          <span
                            key={index}
                            className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold border ${colorClass}`}
                          >
                            {skill}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                {(project.category || project.subcategory) && (
                  <div>
                    <h3 className="text-[11px] font-extrabold uppercase text-slate-900 tracking-[0.2em] mb-3.5">Category & Subcategory</h3>
                    <div className="flex items-center gap-2">
                      {project.category && (
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary-purple/5 border border-primary-purple/10 hover:border-primary-purple/20 transition-colors">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-purple shadow-[0_0_6px_rgba(126,99,248,0.5)]"></span>
                          <span className="text-[11px] font-bold text-primary-purple tracking-tight">{project.category}</span>
                        </div>
                      )}
                      {project.subcategory && (
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-secondary-yellow/10 border border-secondary-yellow/20 hover:border-secondary-yellow/30 transition-colors">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary-yellow shadow-[0_0_6px_rgba(251,221,132,0.5)]"></span>
                          <span className="text-[11px] font-bold text-[#73480d] tracking-tight">{project.subcategory}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Shared Resources */}
              {project.attached_files && project.attached_files.length > 0 && (
                <div className="pt-5 border-t border-slate-300">
                  <h2 className="text-base font-bold mb-4 text-slate-900">Shared Resources</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {project.attached_files.map((file: AttachedFile, index: number) => {
                      const isPdf = file.name?.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
                      const isDoc = file.name?.toLowerCase().endsWith('.docx') || file.name?.toLowerCase().endsWith('.doc') || file.type?.includes('word');
                      
                      const handleDownload = (e: React.MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const link = document.createElement('a');
                        link.href = file.url;
                        link.download = file.name || 'download';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      };
                      
                      return (
                        <div
                          key={index}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3.5 group cursor-pointer hover:border-primary-purple/30 transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-100/50"
                        >
                          <div className={`w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100 ${isPdf ? 'text-red-500' : 'text-blue-500'}`}>
                            {isPdf ? <DocIcon className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-slate-800 text-xs">{file.name || 'Untitled File'}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                              {file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'} • {isPdf ? 'PDF' : isDoc ? 'DOCX' : 'FILE'}
                            </p>
                          </div>
                          <button
                            onClick={handleDownload}
                            className="p-1.5 rounded-lg bg-primary-purple text-white hover:bg-primary-purple/90 transition-colors flex items-center justify-center"
                            title="Download file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-7">
            <div className="sticky top-24 space-y-5">
              {/* Place Bid Button */}
              {canPlaceBid && !userAlreadyBid && creditBalance >= 10 && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="w-full bg-primary-purple hover:bg-primary-purple/90 text-white py-3.5 rounded-2xl font-extrabold text-sm shadow-xl shadow-primary-purple/40 transition-all hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5" />
                      Place Your Bid
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Place Your Bid</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-primary-purple" />
                          <span className="text-sm">Your Credit Balance</span>
                        </div>
                        <span className="px-3 py-1 bg-primary-purple text-white text-sm font-bold rounded-full">{creditBalance} credits</span>
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
                          <p className="text-xs text-slate-500 mt-1">
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
                        <p className="text-xs text-slate-500 mt-1">
                          {bidFormData.proposal.length}/3000 characters
                        </p>
                      </div>
                      <div className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50">
                        <Checkbox
                          id="freelancer-agreement"
                          checked={agreementAccepted}
                          onCheckedChange={(checked) => setAgreementAccepted(checked === true)}
                        />
                        <div className="flex-1">
                          <label htmlFor="freelancer-agreement" className="text-sm font-medium cursor-pointer">
                            I agree to the Freelancer Agreement
                          </label>
                          <p className="text-xs text-slate-500 mt-1">
                            By placing this bid, you agree to abide by THEUNOiA's terms including the 5% commission on project value.
                          </p>
                          <button
                            type="button"
                            onClick={() => setAgreementDialogOpen(true)}
                            className="text-xs text-primary-purple hover:underline mt-1 flex items-center gap-1"
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
              )}

              {/* Client Info */}
              {clientProfile && (
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-lg shadow-slate-100/50">
                  <h3 className="text-[9px] font-extrabold uppercase text-slate-900 tracking-[0.2em] mb-5">About the Client</h3>
                  <div className="flex items-center gap-3.5 mb-5">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md ring-2 ring-slate-50">
                      {clientProfile.profile_picture_url ? (
                        <img src={clientProfile.profile_picture_url} alt={clientProfile.first_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary-purple flex items-center justify-center text-white font-bold text-base">
                          {clientProfile.first_name?.[0]}{clientProfile.last_name?.[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">
                        {clientProfile.first_name} {clientProfile.last_name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold mt-1">
                        <Star className="w-3 h-3 text-secondary-yellow fill-secondary-yellow" />
                        <span className="text-slate-800">4.9</span>
                        <span className="text-slate-400 font-medium">(24 Reviews)</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3.5 mb-5">
                    <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-900">
                      <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span>Payment Verified</span>
                    </div>
                    {clientProfile.city && (
                      <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-900">
                        <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                          <LocationIcon className="w-3.5 h-3.5" />
                        </div>
                        <span>{clientProfile.city}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-900">
                      <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <span>Member since {format(new Date(project.created_at), 'yyyy')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AgreementDialog 
        open={agreementDialogOpen} 
        onOpenChange={setAgreementDialogOpen}
        type="freelancer"
      />
      <CollaborationDialog
        open={collaborationDialogOpen}
        onOpenChange={setCollaborationDialogOpen}
        project={project}
        clientProfile={clientProfile}
        leadName={leadProfile ? `${leadProfile.first_name} ${leadProfile.last_name}` : "Lead"}
      />
    </main>
  );
};

export default ProjectDetailPage;

