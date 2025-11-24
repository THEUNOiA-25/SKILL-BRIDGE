import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Plus, Edit, Trash2, Star, Calendar, Image as ImageIcon, Search, DollarSign, Clock, CheckCircle2, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { z } from "zod";
import { FileUploader } from "@/components/FileUploader";
import { ImageGallery } from "@/components/ImageGallery";
import { FileList } from "@/components/FileList";

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
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [bidProjects, setBidProjects] = useState<BidProject[]>([]);
  const [completedProjects, setCompletedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formType, setFormType] = useState<'work_requirement' | 'portfolio_project'>('work_requirement');
  const [isVerifiedStudent, setIsVerifiedStudent] = useState(false);
  
  const [workFormData, setWorkFormData] = useState({
    title: "",
    description: "",
    budget: "",
    timeline: "",
    skills_required: "",
  });

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

  useEffect(() => {
    if (user) {
      checkVerification();
      fetchAllData();
    }
  }, [user]);

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

  const fetchAllData = async () => {
    if (!user?.id) return;
    
    try {
      // Fetch all open work requirements
      const { data: allData, error: allError } = await supabase
        .from("user_projects")
        .select("*")
        .eq("project_type", "work_requirement")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (allError) throw allError;
      setAllProjects((allData as Project[]) || []);

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
      
      const bidProjectsData = (bidData || []).map((bid: any) => ({
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
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (project?: Project, type: 'work_requirement' | 'portfolio_project' = 'work_requirement') => {
    setFormType(type);
    
    if (project) {
      setEditingProject(project);
      if (project.project_type === 'work_requirement') {
        setWorkFormData({
          title: project.title,
          description: project.description,
          budget: project.budget?.toString() || "",
          timeline: project.timeline || "",
          skills_required: project.skills_required?.join(", ") || "",
        });
      } else {
        setPortfolioFormData({
          title: project.title,
          description: project.description,
          rating: project.rating?.toString() || "",
          client_feedback: project.client_feedback || "",
          completed_at: project.completed_at || "",
        });
      }
      
      // Load existing images and files
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
      });
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
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      if (formType === 'work_requirement') {
        workRequirementSchema.parse(workFormData);

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

          if (error) throw error;
          toast.success("Work requirement posted successfully!");
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

      setDialogOpen(false);
      fetchAllData();
    } catch (error: any) {
      console.error("Error saving project:", error);
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
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
      fetchAllData();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  const handleMarkComplete = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from("user_projects")
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq("id", projectId);

      if (error) throw error;
      toast.success("Project marked as completed!");
      fetchAllData();
    } catch (error) {
      console.error("Error marking project as complete:", error);
      toast.error("Failed to mark project as complete");
    }
  };

  const filteredProjects = allProjects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.skills_required?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderWorkRequirementCard = (project: Project | BidProject, showActions: boolean = false) => {
    const bidProject = project as BidProject;
    const hasBidInfo = 'bidStatus' in project;
    
    return (
    <Card key={project.id} className="rounded-2xl border-border/40 overflow-hidden hover:shadow-lg transition-shadow">
      {(project.cover_image_url || project.image_url) && (
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <img
            src={project.cover_image_url || project.image_url || ''}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
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
        <p className="text-sm text-muted-foreground line-clamp-3">
          {project.description}
        </p>
        <div className="flex items-center gap-4 text-sm">
          {project.budget && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">${project.budget}</span>
            </div>
          )}
          {project.timeline && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{project.timeline}</span>
            </div>
          )}
        </div>
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
              Your Bid: ${bidProject.bidAmount} - {bidProject.bidStatus === 'accepted' && project.status === 'in_progress' ? 'Working' : bidProject.bidStatus === 'accepted' && project.status === 'completed' ? 'Completed' : bidProject.bidStatus}
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
          <div className="flex gap-2 pt-2">
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
              onClick={() => handleOpenDialog(project, 'work_requirement')}
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
      {(project.cover_image_url || project.image_url) && (
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <img
            src={project.cover_image_url || project.image_url || ''}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
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
              onClick={() => handleOpenDialog(project, 'portfolio_project')}
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

  return (
    <main className="flex-1 p-8 ml-64 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Projects</h1>
            <p className="text-muted-foreground">Browse available projects or manage your own</p>
          </div>
          <Button 
            onClick={() => handleOpenDialog(undefined, 'work_requirement')} 
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </Button>
        </div>

        <Tabs defaultValue="browse" className="w-full">
          <TabsList className={`grid w-full max-w-md mb-8 ${isVerifiedStudent ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="browse">Browse Projects</TabsTrigger>
            <TabsTrigger value="my-projects">My Projects</TabsTrigger>
            {isVerifiedStudent && <TabsTrigger value="completed">Completed</TabsTrigger>}
          </TabsList>

          {/* Browse All Available Work Requirements */}
          <TabsContent value="browse" className="space-y-6">
            <div className="flex items-center gap-4">
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
            <div className="flex justify-end">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenDialog(undefined, 'work_requirement')} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Post Work Requirement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProject ? "Edit Work Requirement" : "Post Work Requirement"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
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
                        <Label htmlFor="budget">Budget ($) *</Label>
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
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
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
                  <Button onClick={() => handleOpenDialog(undefined, 'work_requirement')} className="gap-2">
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
          </TabsContent>

          {/* Portfolio Projects - Only for Verified Students */}
          {isVerifiedStudent && (
            <TabsContent value="completed" className="space-y-6">
              <div className="flex justify-end">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleOpenDialog(undefined, 'portfolio_project')} className="gap-2">
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
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
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
                    <Button onClick={() => handleOpenDialog(undefined, 'portfolio_project')} className="gap-2">
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
    </main>
  );
};

export default ProjectsPage;
