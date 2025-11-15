import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Camera, Mail, Phone, Globe, Star, AlertCircle, CheckCircle2, Clock, Edit } from "lucide-react";
import { toast } from "sonner";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    userType: "",
    gender: "",
    dateOfBirth: null as Date | null,
    city: "",
    pinCode: "",
    profilePictureUrl: "",
    bio: "",
    phone: "",
    website: "",
  });
  const [verification, setVerification] = useState<any>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchVerification();
      fetchSkills();
      fetchProjects();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          email: data.email || "",
          userType: data.user_type || "",
          gender: data.gender || "",
          dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : null,
          city: data.city || "",
          pinCode: data.pin_code || "",
          profilePictureUrl: data.profile_picture_url || "",
          bio: data.bio || "",
          phone: data.phone || "",
          website: data.website || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data");
    }
  };

  const fetchVerification = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("student_verifications")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      setVerification(data);
    } catch (error) {
      console.error("Error fetching verification:", error);
      toast.error("Failed to load verification data");
    }
  };

  const fetchSkills = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("user_skills")
        .select("skill_name")
        .eq("user_id", user.id);

      if (error) throw error;

      setSkills(data?.map((s) => s.skill_name) || []);
    } catch (error) {
      console.error("Error fetching skills:", error);
    }
  };

  const fetchProjects = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("user_projects")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });

      if (error) throw error;

      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const handleProfilePictureUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploadingPicture(true);
    try {
      if (profile.profilePictureUrl) {
        const oldPath = profile.profilePictureUrl.split("/").pop();
        if (oldPath) {
          await supabase.storage
            .from("profile-pictures")
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-pictures").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ profile_picture_url: publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      toast.success("Profile picture updated successfully!");
      fetchProfile();
    } catch (error: any) {
      console.error("Error uploading profile picture:", error);
      toast.error(error.message || "Failed to upload profile picture");
    } finally {
      setUploadingPicture(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Not Verified
          </Badge>
        );
    }
  };

  return (
    <main className="flex-1 p-8 ml-64">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Profile Header Card */}
          <Card className="rounded-2xl border-border/40">
            <CardContent className="p-8">
              <div className="flex items-start gap-6">
                {/* Profile Picture */}
                <div className="relative group">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={profile.profilePictureUrl} />
                    <AvatarFallback className="text-3xl">
                      {profile.firstName[0]}
                      {profile.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="profile-picture"
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="h-8 w-8 text-white" />
                    <input
                      id="profile-picture"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePictureUpload}
                      disabled={uploadingPicture}
                    />
                  </label>
                  {uploadingPicture && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold">
                        {profile.firstName} {profile.lastName}
                      </h1>
                      <Badge variant="secondary" className="mt-2">
                        {profile.userType === "student"
                          ? "Student Freelancer"
                          : "Freelancer"}
                      </Badge>
                      {profile.bio && (
                        <p className="mt-3 text-muted-foreground max-w-2xl">
                          {profile.bio}
                        </p>
                      )}
                      {verification?.institute_name && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          📚 {verification.institute_name}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-4">
                        {getStatusBadge(verification?.verification_status || "not_verified")}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate("/profile/verify")}
                        >
                          Verify
                        </Button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button onClick={() => navigate("/profile/edit")}>
                        Edit Profile
                      </Button>
                      <Button variant="outline">View Public Profile</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Two Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Skills Card */}
              <Card className="rounded-2xl border-border/40">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Skills</CardTitle>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No skills added yet
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information Card */}
              <Card className="rounded-2xl border-border/40">
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.email}</span>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{profile.phone}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {profile.website}
                      </a>
                    </div>
                  )}
                  {!profile.phone && !profile.website && (
                    <p className="text-sm text-muted-foreground">
                      No additional contact info
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2">
              <Card className="rounded-2xl border-border/40">
                <CardHeader>
                  <CardTitle>Completed Projects ({projects.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {projects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {projects.map((project) => (
                        <Card key={project.id} className="overflow-hidden">
                          {project.image_url && (
                            <img
                              src={project.image_url}
                              alt={project.title}
                              className="w-full h-48 object-cover"
                            />
                          )}
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-2">{project.title}</h3>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {project.description}
                            </p>
                            {project.rating && (
                              <div className="flex items-center gap-1 text-sm">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{project.rating}</span>
                                <span className="text-muted-foreground">from client</span>
                              </div>
                            )}
                            {project.client_feedback && (
                              <p className="text-xs text-muted-foreground mt-2 italic">
                                "{project.client_feedback}"
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        No completed projects yet
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
    </main>
  );
};

export default ProfilePage;
