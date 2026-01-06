import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Plus, Edit, Trash2, Star, Calendar, Image as ImageIcon, Search, IndianRupee, Clock, CheckCircle2, Paperclip, CalendarIcon, Users as UsersIcon, Coins } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { FileUploader } from "@/components/FileUploader";
import { ImageGallery } from "@/components/ImageGallery";
import { FileList } from "@/components/FileList";
import { PROJECT_CATEGORIES, getCategoryList, getSubcategoriesForCategory } from "@/data/categories";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  rating: number | null;
  client_feedback: string | null;
  completed_at: string | null;
  created_at: string;
  project_type: 'work_requirement' | 'portfolio_project';
  budget: number | null;
  timeline: string | null;
  skills_required: string[] | null;
  status: string | null;
  bidding_deadline: string | null;
  category: string | null;
  subcategory: string | null;
}

interface BidProject extends Project {
  bidStatus: string;
  bidAmount: number;
}

const workRequirementSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(2000, "Description must be less than 2000 characters"),
  budget: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Budget must be a positive number"),
  timeline: z.string().trim().min(3, "Timeline must be at least 3 characters").max(100, "Timeline must be less than 100 characters"),
  skills_required: z.string().trim().min(1, "At least one skill is required"),
});

const portfolioProjectSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(2000, "Description must be less than 2000 characters"),
  rating: z.string().optional().refine((val) => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 5;
  }, "Rating must be between 0 and 5"),
  client_feedback: z.string().trim().max(500, "Feedback must be less than 500 characters").optional(),
  completed_at: z.string().optional(),
});

const ProjectsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [bidProjects, setBidProjects] = useState<BidProject[]>([]);
  const [completedProjects, setCompletedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("browse");
  const [workDialogOpen, setWorkDialogOpen] = useState(false);
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formType, setFormType] = useState<'work_requirement' | 'portfolio_project'>('work_requirement');
  const [isVerifiedStudent, setIsVerifiedStudent] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  
  const [workFormData, setWorkFormData] = useState({
    title: "",
    description: "",
    budget: "",
    timeline: "",
    skills_required: "",
    category: "",
    subcategory: "",
  });

  const [biddingDeadline, setBiddingDeadline] = useState<Date | undefined>();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [isCommunityTask, setIsCommunityTask] = useState(false);
  const [userCollegeId, setUserCollegeId] = useState<string | null>(null);

  const [portfolioFormData, setPortfolioFormData] = useState({
    title: "",
    description: "",
    rating: "",
    client_feedback: "",
    completed_at: "",
  });

  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState<string>("");

  // Rating dialog state
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [projectToRate, setProjectToRate] = useState<Project | null>(null);
  const [acceptedFreelancerId, setAcceptedFreelancerId] = useState<string | null>(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  useEffect(() => {
    // Always fetch browse projects (public)
    fetchBrowseProjects();
    
    // Fetch user-specific data only if authenticated
    if (user) {
      checkVerification();
      fetchUserData();
      fetchCreditBalance();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Handle create query param from dashboard
  useEffect(() => {
    if (searchParams.get('create') === 'true' && user) {
      setActiveTab('my-projects');
      openWorkRequirementDialog();
      // Clear the query param
      setSearchParams({});
    }
  }, [searchParams, user]);

  const checkVerification = async () => {
    if (!user?.id) return;
    
    try {
      const { data: accessData, error: accessError } = await supabase
        .from('freelancer_access')
        .select('has_access')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (accessError) throw accessError;
      setIsVerifiedStudent(accessData?.has_access || false);

      // Get user's college ID for community tasks
      const { data: verificationData } = await supabase
        .from('student_verifications')
        .select('college_id')
        .eq('user_id', user.id)
        .eq('verification_status', 'approved')
        .maybeSingle();

      setUserCollegeId(verificationData?.college_id || null);
    } catch (error) {
      console.error('Error checking verification:', error);
    }
  };

  const fetchCreditBalance = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('freelancer_credits')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setCreditBalance(data?.balance || 0);
    } catch (error) {
      console.error('Error fetching credit balance:', error);
    }
  };

  const fetchBrowseProjects = async () => {
    try {
      // Fetch all open work requirements (public, no auth required), excluding community tasks
      const { data: allData, error: allError } = await supabase
        .from("user_projects")
        .select("*")
        .eq("project_type", "work_requirement")
        .eq("status", "open")
        .eq("is_community_task", false)
        .order("created_at", { ascending: false });

      if (allError) throw allError;
      setAllProjects((allData as Project[]) || []);
    } catch (error) {
      console.error("Error fetching browse projects:", error);
      toast.error("Failed to load projects");
    }
  };

  const fetchUserData = async () => {
    if (!user?.id) return;
    
    try {
      // Fetch user's own work requirements
      const { data: myData, error: myError } = await supabase
        .from("user_projects")
        .select("*")
        .eq("user_id", user.id)
        .eq("project_type", "work_requirement")
        .order("created_at", { ascending: false });

      if (myError) throw myError;
      setMyProjects((myData as Project[]) || []);

      // Fetch projects where user has placed bids
      const { data: bidData, error: bidError } = await supabase
        .from("bids")
        .select(`
          amount,
          status,
          user_projects (*)
        `)
        .eq("freelancer_id", user.id)
        .order("created_at", { ascending: false });

      if (bidError) throw bidError;
      
      const bidProjectsData = (bidData || [])
        .filter((bid: any) => bid.user_projects !== null)
        .map((bid: any) => ({
          ...bid.user_projects,
          bidStatus: bid.status,
          bidAmount: bid.amount,
        })) as BidProject[];
      setBidProjects(bidProjectsData);

      // Fetch user's portfolio projects (only if verified student)
      if (isVerifiedStudent) {
        const { data: completedData, error: completedError } = await supabase
          .from("user_projects")
          .select("*")
          .eq("user_id", user.id)
          .eq("project_type", "portfolio_project")
          .order("completed_at", { ascending: false });

        if (completedError) throw completedError;
        setCompletedProjects((completedData as Project[]) || []);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load your projects");
    } finally {
      setLoading(false);
    }
  };

  const openWorkRequirementDialog = (project?: Project) => {
    if (!user) {
      toast.error("Please log in to create or edit projects");
      navigate('/login');
      return;
    }

    setFormType('work_requirement');

    if (project) {
      setEditingProject(project);
      setWorkFormData({
        title: project.title,
        description: project.description,
        budget: project.budget?.toString() || "",
        timeline: project.timeline || "",
        skills_required: project.skills_required?.join(", ") || "",
        category: project.category || "",
        subcategory: project.subcategory || "",
      });

      setBiddingDeadline(project.bidding_deadline ? new Date(project.bidding_deadline) : undefined);

      const images = project.additional_images || [];
      setUploadedImages(images.map(url => ({ name: url.split('/').pop(), url, type: 'image', size: 0 })));
      setCoverImageUrl(project.cover_image_url || images[0] || "");
      setUploadedFiles(project.attached_files || []);
    } else {
      setEditingProject(null);
      setWorkFormData({
        title: "",
        description: "",
        budget: "",
        timeline: "",
        skills_required: "",
        category: "",
        subcategory: "",
      });
      setBiddingDeadline(undefined);
      setUploadedImages([]);
      setUploadedFiles([]);
      setCoverImageUrl("");
    }

    setWorkDialogOpen(true);
  };

  const openPortfolioDialog = (project?: Project) => {
    if (!user) {
      toast.error("Please log in to create or edit portfolio projects");
      navigate('/login');
      return;
    }

    setFormType('portfolio_project');

    if (project) {
      setEditingProject(project);
      setPortfolioFormData({
        title: project.title,
        description: project.description,
        rating: project.rating?.toString() || "",
        client_feedback: project.client_feedback || "",
        completed_at: project.completed_at || "",
      });

      const images = project.additional_images || [];
      setUploadedImages(images.map(url => ({ name: url.split('/').pop(), url, type: 'image', size: 0 })));
      setCoverImageUrl(project.cover_image_url || images[0] || "");
      setUploadedFiles(project.attached_files || []);
    } else {
      setEditingProject(null);
      setPortfolioFormData({
        title: "",
        description: "",
        rating: "",
        client_feedback: "",
        completed_at: "",
      });
      setUploadedImages([]);
      setUploadedFiles([]);
      setCoverImageUrl("");
    }

    setPortfolioDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      if (formType === 'work_requirement') {
        workRequirementSchema.parse(workFormData);

        // Check credits before creating new task (not for editing)
        if (!editingProject && creditBalance < 10) {
          toast.error(`Insufficient credits. You need 10 credits to post a task. Current balance: ${creditBalance}`);
          return;
        }

        const imageUrls = uploadedImages.map(img => img.url);
        const finalCoverImage = coverImageUrl || imageUrls[0] || null;

        const projectData = {
          user_id: user.id,
          title: workFormData.title.trim(),
          description: workFormData.description.trim(),
          budget: parseFloat(workFormData.budget),
          timeline: workFormData.timeline.trim(),
          skills_required: workFormData.skills_required.split(',').map(s => s.trim()),
          cover_image_url: finalCoverImage,
          additional_images: imageUrls,
          attached_files: uploadedFiles,
          project_type: 'work_requirement',
          status: 'open',
          bidding_deadline: biddingDeadline ? biddingDeadline.toISOString() : null,
          category: workFormData.category || null,
          subcategory: workFormData.subcategory || null,
          is_community_task: isCommunityTask && isVerifiedStudent,
          community_college_id: (isCommunityTask && isVerifiedStudent && userCollegeId) ? userCollegeId : null,
        };

        if (editingProject) {
          const { error } = await supabase
            .from("user_projects")
            .update(projectData)
            .eq("id", editingProject.id);

          if (error) throw error;
          toast.success("Work requirement updated successfully!");
        } else {
          const { error } = await supabase
            .from("user_projects")
            .insert(projectData);

          if (error) {
            // Handle insufficient credits error from trigger
            if (error.message?.includes('Insufficient credits')) {
              toast.error(error.message);
              return;
            }
            throw error;
          }
          toast.success("Work requirement posted successfully! (10 credits deducted)");
          fetchCreditBalance(); // Refresh credit balance
        }
      } else {
        portfolioProjectSchema.parse(portfolioFormData);

        const imageUrls = uploadedImages.map(img => img.url);
        const finalCoverImage = coverImageUrl || imageUrls[0] || null;

        const projectData = {
          user_id: user.id,
          title: portfolioFormData.title.trim(),
          description: portfolioFormData.description.trim(),
          cover_image_url: finalCoverImage,
          additional_images: imageUrls,
          attached_files: uploadedFiles,
          rating: portfolioFormData.rating ? parseFloat(portfolioFormData.rating) : null,
          client_feedback: portfolioFormData.client_feedback?.trim() || null,
          completed_at: portfolioFormData.completed_at || new Date().toISOString(),
          project_type: 'portfolio_project',
          status: 'completed',
        };

        if (editingProject) {
          const { error } = await supabase
            .from("user_projects")
            .update(projectData)
            .eq("id", editingProject.id);

          if (error) throw error;
          toast.success("Portfolio project updated successfully!");
        } else {
          const { error } = await supabase
            .from("user_projects")
            .insert(projectData);

          if (error) throw error;
          toast.success("Portfolio project added successfully!");
        }
      }

      if (formType === 'work_requirement') {
        setWorkDialogOpen(false);
      } else {
        setPortfolioDialogOpen(false);
      }
      fetchBrowseProjects();
      if (user) fetchUserData();
    } catch (error: any) {
      console.error("Error saving project:", error);
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error.message?.includes('Insufficient credits')) {
        toast.error(error.message);
      } else {
        toast.error("Failed to save project");
      }
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const { error } = await supabase
        .from("user_projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;
      toast.success("Project deleted successfully!");
      fetchBrowseProjects();
      if (user) fetchUserData();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  const handleMarkComplete = async (projectId: string) => {
    // Find the project
    const project = myProjects.find(p => p.id === projectId);
    if (!project) return;

    // Find the accepted bid to get freelancer_id
    try {
      const { data: acceptedBid, error } = await supabase
        .from("bids")
        .select("freelancer_id")
        .eq("project_id", projectId)
        .eq("status", "accepted")
        .maybeSingle();

      if (error) throw error;

      if (!acceptedBid) {
        toast.error("No accepted bid found for this project");
        return;
      }

      setProjectToRate(project);
      setAcceptedFreelancerId(acceptedBid.freelancer_id);
      setRatingDialogOpen(true);
    } catch (error) {
      console.error("Error fetching accepted bid:", error);
      toast.error("Failed to load project details");
    }
  };

  const handleSubmitRating = async (rating: number, feedback: string) => {
    if (!user?.id || !projectToRate || !acceptedFreelancerId) return;

    setIsSubmittingRating(true);
    try {
      // Insert rating
      const { error: ratingError } = await supabase
        .from("freelancer_ratings")
        .insert({
          project_id: projectToRate.id,
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
        .eq("id", projectToRate.id);

      if (projectError) throw projectError;

      toast.success("Project completed and rating submitted!");
      setRatingDialogOpen(false);
      setProjectToRate(null);
      setAcceptedFreelancerId(null);
      fetchBrowseProjects();
      if (user) fetchUserData();
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Failed to submit rating");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const filteredProjects = allProjects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.skills_required?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
      project.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.subcategory?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || project.category === selectedCategory;
    const matchesSubcategory = selectedSubcategory === "all" || project.subcategory === selectedSubcategory;
    
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  const renderWorkRequirementCard = (project: Project | BidProject, showActions: boolean = false) => {
    const bidProject = project as BidProject;
    const hasBidInfo = 'bidStatus' in project;
    const biddingClosed = project.bidding_deadline ? new Date(project.bidding_deadline) < new Date() : false;
    const isClosingSoon = project.bidding_deadline ? 
      new Date(project.bidding_deadline).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000 && !biddingClosed : false;
    
    return (
    <Card key={project.id} className="rounded-2xl border-border/40 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video w-full overflow-hidden bg-muted">
        {(project.cover_image_url || project.image_url) ? (
          <img
            src={project.cover_image_url || project.image_url || ''}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <ImageIcon className="w-16 h-16 text-muted-foreground/40" />
          </div>
        )}
      </div>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{project.title}</CardTitle>
            <p className="text-xs text-muted-foreground">
              Posted {format(new Date(project.created_at), "MMM d, yyyy")}
            </p>
          </div>
          <Badge variant={project.status === 'open' ? 'default' : 'secondary'}>
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {(project.category || project.subcategory) && (
          <div className="flex gap-2 flex-wrap">
            {project.category && (
              <Badge variant="outline" className="text-xs">
                {project.category}
              </Badge>
            )}
            {project.subcategory && (
              <Badge variant="secondary" className="text-xs">
                {project.subcategory}
              </Badge>
            )}
          </div>
        )}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {project.description}
        </p>
        <div className="flex items-center gap-4 text-sm flex-wrap">
          {project.budget && (
            <div className="flex items-center gap-1">
              <IndianRupee className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">₹{project.budget}</span>
            </div>
          )}
          {project.timeline && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{project.timeline}</span>
            </div>
          )}
          {project.bidding_deadline && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className={cn(
                "text-muted-foreground text-xs",
                biddingClosed && "text-destructive",
                isClosingSoon && "text-orange-600 font-semibold"
              )}>
                {biddingClosed ? "Bidding Closed" : `Bids until ${format(new Date(project.bidding_deadline), "MMM d")}`}
              </span>
            </div>
          )}
        </div>
        {biddingClosed && project.status === 'open' && (
          <Badge variant="destructive" className="text-xs w-fit">
            Bidding Closed
          </Badge>
        )}
        {isClosingSoon && !biddingClosed && (
          <Badge variant="outline" className="text-xs w-fit border-orange-600 text-orange-600">
            Closing Soon
          </Badge>
        )}
        {project.skills_required && project.skills_required.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {project.skills_required.map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        )}
        {hasBidInfo && (
          <div className="pt-2">
            <Badge 
              variant={bidProject.bidStatus === 'accepted' ? 'default' : bidProject.bidStatus === 'rejected' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              Your Bid: ₹{bidProject.bidAmount} - {bidProject.bidStatus === 'accepted' && project.status === 'in_progress' ? 'Working' : bidProject.bidStatus === 'accepted' && project.status === 'completed' ? 'Completed' : bidProject.bidStatus}
            </Badge>
          </div>
        )}
        {project.attached_files && project.attached_files.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Paperclip className="w-3 h-3" />
            <span>{project.attached_files.length} files attached</span>
          </div>
        )}
        {showActions ? (
          <div className="space-y-2 pt-2">
            <Button 
              className="w-full" 
              size="sm" 
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              View Details & Bids
            </Button>
            <div className="flex gap-2">
              {project.status === 'open' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleMarkComplete(project.id)}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Mark Complete
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => openWorkRequirementDialog(project)}
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(project.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ) : (
          <Button className="w-full mt-2" size="sm" onClick={() => navigate(`/projects/${project.id}`)}>
            View Details & Bid
          </Button>
        )}
      </CardContent>
    </Card>
    );
  };

  const renderPortfolioCard = (project: Project, showActions: boolean = false) => (
    <Card key={project.id} className="rounded-2xl border-border/40 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video w-full overflow-hidden bg-muted">
        {(project.cover_image_url || project.image_url) ? (
          <img
            src={project.cover_image_url || project.image_url || ''}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <ImageIcon className="w-16 h-16 text-muted-foreground/40" />
          </div>
        )}
      </div>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{project.title}</CardTitle>
            <p className="text-xs text-muted-foreground">
              Posted {format(new Date(project.created_at), "MMM d, yyyy")}
            </p>
          </div>
          {project.rating && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              <span>{project.rating}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {project.description}
        </p>
        {project.completed_at && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            <span>Completed {format(new Date(project.completed_at), "MMM d, yyyy")}</span>
          </div>
        )}
        {project.client_feedback && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground italic line-clamp-2">
              "{project.client_feedback}"
            </p>
          </div>
        )}
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => openPortfolioDialog(project)}
            >
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(project.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  return (
    <main className="flex-1 p-8 bg-background">
        <div className="max-w-7xl mx-auto">
          {!user && (
            <div className="flex items-center justify-between mb-6 p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">
                Sign in to post projects, place bids, and manage your work
              </p>
              <Button onClick={() => navigate('/login')} size="sm">
                Sign In
              </Button>
            </div>
          )}
          
          <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Projects</h1>
            <p className="text-muted-foreground">Browse available projects or manage your own</p>
          </div>
          <Button 
            onClick={() => {
              setActiveTab('my-projects');
              openWorkRequirementDialog();
            }} 
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full max-w-md mb-8 ${isVerifiedStudent ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="browse">Browse Projects</TabsTrigger>
            <TabsTrigger value="my-projects">My Projects</TabsTrigger>
            {isVerifiedStudent && <TabsTrigger value="completed">Completed</TabsTrigger>}
          </TabsList>

          {/* Browse All Available Work Requirements */}
          <TabsContent value="browse" className="space-y-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search projects by title, description, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 rounded-2xl border-border/60"
                />
              </div>
              <Select value={selectedCategory} onValueChange={(value) => {
                setSelectedCategory(value);
                setSelectedSubcategory("all");
              }}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {getCategoryList().map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCategory && selectedCategory !== "all" && (
                <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="All Subcategories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subcategories</SelectItem>
                    {getSubcategoriesForCategory(selectedCategory).map((subcat) => (
                      <SelectItem key={subcat} value={subcat}>
                        {subcat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading projects...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <Card className="rounded-2xl border-border/40">
                <CardContent className="py-12 text-center">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Available Projects</h3>
                  <p className="text-muted-foreground">Check back later for new opportunities</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => renderWorkRequirementCard(project, false))}
              </div>
            )}
          </TabsContent>

          {/* User's Posted Work Requirements */}
          <TabsContent value="my-projects" className="space-y-6">
            {!user ? (
              <Card className="rounded-2xl border-border/40">
                <CardContent className="py-12 text-center">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Sign In Required</h3>
                  <p className="text-muted-foreground mb-6">Please sign in to view and manage your projects</p>
                  <Button onClick={() => navigate('/login')} className="gap-2">
                    Sign In
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex justify-end">
                  <Dialog open={workDialogOpen} onOpenChange={setWorkDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => openWorkRequirementDialog()} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Post Work Requirement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProject ? "Edit Work Requirement" : "Post Work Requirement"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
                    {!editingProject && (
                      <div className={`flex items-center gap-2 p-3 rounded-lg ${creditBalance >= 10 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                        <Coins className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Your Balance: {creditBalance} credits {creditBalance < 10 && '(Need 10 credits to post)'}
                        </span>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={workFormData.title}
                        onChange={(e) => setWorkFormData({ ...workFormData, title: e.target.value })}
                        placeholder="E-commerce Website Development"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={workFormData.description}
                        onChange={(e) => setWorkFormData({ ...workFormData, description: e.target.value })}
                        placeholder="Describe your project requirements..."
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select
                          value={workFormData.category}
                          onValueChange={(value) => {
                            setWorkFormData({ ...workFormData, category: value, subcategory: "" });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {getCategoryList().map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subcategory">Subcategory *</Label>
                        <Select
                          value={workFormData.subcategory}
                          onValueChange={(value) => {
                            setWorkFormData({ ...workFormData, subcategory: value });
                          }}
                          disabled={!workFormData.category}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select subcategory" />
                          </SelectTrigger>
                          <SelectContent>
                            {workFormData.category &&
                              getSubcategoriesForCategory(workFormData.category).map((subcat) => (
                                <SelectItem key={subcat} value={subcat}>
                                  {subcat}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="budget">Budget (₹) *</Label>
                        <Input
                          id="budget"
                          type="number"
                          min="0"
                          step="0.01"
                          value={workFormData.budget}
                          onChange={(e) => setWorkFormData({ ...workFormData, budget: e.target.value })}
                          placeholder="500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timeline">Timeline *</Label>
                        <Input
                          id="timeline"
                          value={workFormData.timeline}
                          onChange={(e) => setWorkFormData({ ...workFormData, timeline: e.target.value })}
                          placeholder="2 weeks"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="skills_required">Skills Required (comma-separated) *</Label>
                      <Input
                        id="skills_required"
                        value={workFormData.skills_required}
                        onChange={(e) => setWorkFormData({ ...workFormData, skills_required: e.target.value })}
                        placeholder="React, Node.js, MongoDB"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bidding Deadline (Optional)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !biddingDeadline && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {biddingDeadline ? format(biddingDeadline, "PPP") : "Pick a deadline"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={biddingDeadline}
                            onSelect={setBiddingDeadline}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-muted-foreground">
                        After this date, freelancers won't be able to place bids
                      </p>
                    </div>
                    {isVerifiedStudent && userCollegeId && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="communityTask">Community Task</Label>
                            <p className="text-xs text-muted-foreground">
                              Only visible to students from your college
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              id="communityTask"
                              checked={isCommunityTask}
                              onChange={(e) => setIsCommunityTask(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Project Images</Label>
                      <FileUploader
                        type="image"
                        maxFiles={5}
                        onFilesChange={setUploadedImages}
                        currentFiles={uploadedImages}
                      />
                      {uploadedImages.length > 1 && (
                        <ImageGallery
                          images={uploadedImages.map(img => img.url)}
                          coverImageUrl={coverImageUrl}
                          onCoverChange={setCoverImageUrl}
                          editable
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Additional Files (PDF, DOC, etc.)</Label>
                      <FileUploader
                        type="file"
                        maxFiles={10}
                        maxSizeInMB={10}
                        onFilesChange={setUploadedFiles}
                        currentFiles={uploadedFiles}
                      />
                      {uploadedFiles.length > 0 && (
                        <FileList 
                          files={uploadedFiles}
                          onDelete={(index) => setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))}
                          editable
                        />
                      )}
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button onClick={handleSave} className="flex-1">
                        {editingProject ? "Update" : "Post"} Work Requirement
                      </Button>
                      <Button variant="outline" onClick={() => setWorkDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading your projects...</p>
              </div>
            ) : myProjects.length === 0 ? (
              <Card className="rounded-2xl border-border/40">
                <CardContent className="py-12 text-center">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Posted Projects</h3>
                  <p className="text-muted-foreground mb-6">Post your first project to find freelancers</p>
                  <Button onClick={() => openWorkRequirementDialog()} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Post Your First Project
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Your Posted Projects</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myProjects.map((project) => renderWorkRequirementCard(project, true))}
                  </div>
                </div>

                {bidProjects.length > 0 && (
                  <div className="mt-10">
                    <h3 className="text-xl font-semibold mb-4">Projects You've Bid On</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {bidProjects.map((project) => renderWorkRequirementCard(project, false))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
          )}
          </TabsContent>

          {/* Portfolio Projects - Only for Verified Students */}
          {isVerifiedStudent && (
            <TabsContent value="completed" className="space-y-6">
              <div className="flex justify-end">
                <Dialog open={portfolioDialogOpen} onOpenChange={setPortfolioDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openPortfolioDialog()} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Portfolio Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingProject ? "Edit Portfolio Project" : "Add Portfolio Project"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                      <div className="space-y-2">
                        <Label htmlFor="portfolio_title">Title *</Label>
                        <Input
                          id="portfolio_title"
                          value={portfolioFormData.title}
                          onChange={(e) => setPortfolioFormData({ ...portfolioFormData, title: e.target.value })}
                          placeholder="E-commerce Website Redesign"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="portfolio_description">Description *</Label>
                        <Textarea
                          id="portfolio_description"
                          value={portfolioFormData.description}
                          onChange={(e) => setPortfolioFormData({ ...portfolioFormData, description: e.target.value })}
                          placeholder="Describe the project you completed..."
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Project Images</Label>
                        <FileUploader
                          type="image"
                          maxFiles={5}
                          onFilesChange={setUploadedImages}
                          currentFiles={uploadedImages}
                        />
                        {uploadedImages.length > 1 && (
                          <ImageGallery
                            images={uploadedImages.map(img => img.url)}
                            coverImageUrl={coverImageUrl}
                            onCoverChange={setCoverImageUrl}
                            editable
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Additional Files (PDF, DOC, etc.)</Label>
                        <FileUploader
                          type="file"
                          maxFiles={10}
                          maxSizeInMB={10}
                          onFilesChange={setUploadedFiles}
                          currentFiles={uploadedFiles}
                        />
                        {uploadedFiles.length > 0 && (
                          <FileList 
                            files={uploadedFiles}
                            onDelete={(index) => setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))}
                            editable
                          />
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="portfolio_rating">Rating (0-5)</Label>
                          <Input
                            id="portfolio_rating"
                            type="number"
                            min="0"
                            max="5"
                            step="0.1"
                            value={portfolioFormData.rating}
                            onChange={(e) => setPortfolioFormData({ ...portfolioFormData, rating: e.target.value })}
                            placeholder="4.5"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="portfolio_completed_at">Completion Date</Label>
                          <Input
                            id="portfolio_completed_at"
                            type="date"
                            value={portfolioFormData.completed_at}
                            onChange={(e) => setPortfolioFormData({ ...portfolioFormData, completed_at: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="portfolio_client_feedback">Client Feedback</Label>
                        <Textarea
                          id="portfolio_client_feedback"
                          value={portfolioFormData.client_feedback}
                          onChange={(e) => setPortfolioFormData({ ...portfolioFormData, client_feedback: e.target.value })}
                          placeholder="What did the client say about this project?"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button onClick={handleSave} className="flex-1">
                          {editingProject ? "Update" : "Add"} Portfolio Project
                        </Button>
                      <Button variant="outline" onClick={() => setPortfolioDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading your portfolio...</p>
                </div>
              ) : completedProjects.length === 0 ? (
                <Card className="rounded-2xl border-border/40">
                  <CardContent className="py-12 text-center">
                    <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Portfolio Projects</h3>
                    <p className="text-muted-foreground mb-6">Showcase your completed work</p>
                    <Button onClick={() => openPortfolioDialog()} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Your First Project
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedProjects.map((project) => renderPortfolioCard(project, true))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
        </div>

        {/* Rating Dialog */}
        <RatingDialog
          open={ratingDialogOpen}
          onOpenChange={setRatingDialogOpen}
          onSubmit={handleSubmitRating}
          projectTitle={projectToRate?.title || ""}
          isSubmitting={isSubmittingRating}
        />
      </main>
  );
};

export default ProjectsPage;
