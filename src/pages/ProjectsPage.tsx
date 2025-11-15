import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Star, Calendar, Image as ImageIcon, Search, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { z } from "zod";

interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  image_url: string | null;
  rating: number | null;
  client_feedback: string | null;
  completed_at: string | null;
  created_at: string;
}

const projectSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(2000, "Description must be less than 2000 characters"),
  image_url: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
  rating: z.string().optional().refine((val) => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 5;
  }, "Rating must be between 0 and 5"),
  client_feedback: z.string().trim().max(500, "Feedback must be less than 500 characters").optional(),
});

const ProjectsPage = () => {
  const { user } = useAuth();
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [completedProjects, setCompletedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    rating: "",
    client_feedback: "",
    completed_at: "",
  });

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    if (!user?.id) return;
    
    try {
      // Fetch all open projects (available for bidding) from all users
      const { data: allData, error: allError } = await supabase
        .from("user_projects")
        .select("*")
        .is("completed_at", null)
        .order("created_at", { ascending: false });

      if (allError) throw allError;
      setAllProjects(allData || []);

      // Fetch user's own projects (both open and completed)
      const { data: myData, error: myError } = await supabase
        .from("user_projects")
        .select("*")
        .eq("user_id", user.id)
        .is("completed_at", null)
        .order("created_at", { ascending: false });

      if (myError) throw myError;
      setMyProjects(myData || []);

      // Fetch user's completed projects
      const { data: completedData, error: completedError } = await supabase
        .from("user_projects")
        .select("*")
        .eq("user_id", user.id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false });

      if (completedError) throw completedError;
      setCompletedProjects(completedData || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        title: project.title,
        description: project.description,
        image_url: project.image_url || "",
        rating: project.rating?.toString() || "",
        client_feedback: project.client_feedback || "",
        completed_at: project.completed_at || "",
      });
    } else {
      setEditingProject(null);
      setFormData({
        title: "",
        description: "",
        image_url: "",
        rating: "",
        client_feedback: "",
        completed_at: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      // Validate form data
      projectSchema.parse({
        title: formData.title,
        description: formData.description,
        image_url: formData.image_url,
        rating: formData.rating,
        client_feedback: formData.client_feedback,
      });

      const projectData = {
        user_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        image_url: formData.image_url.trim() || null,
        rating: formData.rating ? parseFloat(formData.rating) : null,
        client_feedback: formData.client_feedback?.trim() || null,
        completed_at: formData.completed_at || null,
      };

      if (editingProject) {
        const { error } = await supabase
          .from("user_projects")
          .update(projectData)
          .eq("id", editingProject.id);

        if (error) throw error;
        toast.success("Project updated successfully!");
      } else {
        const { error } = await supabase
          .from("user_projects")
          .insert(projectData);

        if (error) throw error;
        toast.success("Project posted successfully!");
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
        .update({ completed_at: new Date().toISOString() })
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
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProjectCard = (project: Project, showActions: boolean = false) => (
    <Card key={project.id} className="rounded-2xl border-border/40 overflow-hidden hover:shadow-lg transition-shadow">
      {project.image_url && (
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <img
            src={project.image_url}
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
            {!project.completed_at && (
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
              className={!project.completed_at ? "" : "flex-1"}
              onClick={() => handleOpenDialog(project)}
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
        {!showActions && !project.completed_at && (
          <Button className="w-full mt-2" size="sm">
            View Details & Bid
          </Button>
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                Post Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingProject ? "Edit Project" : "Add New Project"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="E-commerce Website Redesign"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your project..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rating">Rating (0-5)</Label>
                    <Input
                      id="rating"
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                      placeholder="4.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="completed_at">Completion Date</Label>
                    <Input
                      id="completed_at"
                      type="date"
                      value={formData.completed_at}
                      onChange={(e) => setFormData({ ...formData, completed_at: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_feedback">Client Feedback</Label>
                  <Textarea
                    id="client_feedback"
                    value={formData.client_feedback}
                    onChange={(e) => setFormData({ ...formData, client_feedback: e.target.value })}
                    placeholder="What did the client say about this project?"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSave} className="flex-1">
                    {editingProject ? "Update Project" : "Create Project"}
                  </Button>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
            <TabsTrigger value="browse">Browse Projects</TabsTrigger>
            <TabsTrigger value="my-projects">My Projects</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          {/* Browse All Available Projects */}
          <TabsContent value="browse" className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search projects..."
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
                {filteredProjects.map((project) => renderProjectCard(project, false))}
              </div>
            )}
          </TabsContent>

          {/* User's Posted Projects */}
          <TabsContent value="my-projects" className="space-y-6">
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
                  <Button onClick={() => handleOpenDialog()} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Post Your First Project
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProjects.map((project) => renderProjectCard(project, true))}
              </div>
            )}
          </TabsContent>

          {/* User's Completed Projects */}
          <TabsContent value="completed" className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading completed projects...</p>
              </div>
            ) : completedProjects.length === 0 ? (
              <Card className="rounded-2xl border-border/40">
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Completed Projects</h3>
                  <p className="text-muted-foreground">Your completed projects will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedProjects.map((project) => renderProjectCard(project, true))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default ProjectsPage;
