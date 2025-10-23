import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, CheckCircle2, Clock, XCircle, AlertCircle, Upload, Camera } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    gender: "",
    city: "",
    pinCode: "",
    dateOfBirth: undefined as Date | undefined,
    profilePictureUrl: "",
  });

  // Verification state
  const [verification, setVerification] = useState({
    status: "not_submitted",
    instituteName: "",
    instituteEmail: "",
    enrollmentId: "",
    verificationMethod: "email",
    rejectionReason: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchProfile();
    fetchVerification();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    
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
          gender: data.gender || "",
          city: data.city || "",
          pinCode: data.pin_code || "",
          dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : undefined,
          profilePictureUrl: data.profile_picture_url || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchVerification = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("student_verifications")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setVerification({
          status: data.verification_status || "not_submitted",
          instituteName: data.institute_name || "",
          instituteEmail: data.institute_email || "",
          enrollmentId: data.enrollment_id || "",
          verificationMethod: data.verification_method || "email",
          rejectionReason: data.rejection_reason || "",
        });
      }
    } catch (error) {
      console.error("Error fetching verification:", error);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          gender: profile.gender,
          city: profile.city,
          pin_code: profile.pinCode,
          date_of_birth: profile.dateOfBirth?.toISOString().split('T')[0],
          profile_completed: true,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string) => {
    return email.endsWith(".edu") || email.endsWith(".ac.in");
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      // Delete old profile picture if exists
      if (profile.profilePictureUrl) {
        const oldPath = profile.profilePictureUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('profile-pictures')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new profile picture
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      // Update profile in database
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, profilePictureUrl: publicUrl });

      toast({
        title: "Success",
        description: "Profile picture updated successfully.",
      });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleVerificationSubmit = async () => {
    if (!user) return;

    if (!verification.instituteName || !verification.instituteEmail) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(verification.instituteEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please use a valid institute email ending with .edu or .ac.in",
        variant: "destructive",
      });
      return;
    }

    setVerificationLoading(true);
    try {
      const { error } = await supabase
        .from("student_verifications")
        .upsert({
          user_id: user.id,
          institute_name: verification.instituteName,
          institute_email: verification.instituteEmail,
          enrollment_id: verification.enrollmentId || null,
          verification_method: "email",
          verification_status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Verification Submitted",
        description: "Your verification request has been submitted successfully.",
      });

      fetchVerification();
    } catch (error) {
      console.error("Error submitting verification:", error);
      toast({
        title: "Error",
        description: "Failed to submit verification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (verification.status) {
      case "approved":
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Verified Student
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="w-4 h-4 mr-1" />
            Verification Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="w-4 h-4 mr-1" />
            Verification Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="w-4 h-4 mr-1" />
            Not Verified
          </Badge>
        );
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-border/40 bg-card/30 backdrop-blur-sm">
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="px-6 py-8 border-b border-border/40">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              THEUNOIA
            </h2>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-2 py-5 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/dashboard")}
            >
              <div className="w-5 h-5 grid grid-cols-2 gap-0.5">
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
              </div>
              Dashboard
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 bg-muted text-foreground font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </Button>
          </nav>

          {/* Logout at Bottom */}
          <div className="px-2 py-5 border-t border-border/40">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
              onClick={() => signOut()}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-border/40 bg-card/30 backdrop-blur-sm">
          <h1 className="text-2xl font-semibold text-foreground">Profile Settings</h1>
        </div>

        {/* Content */}
        <div className="container mx-auto p-8 max-w-6xl">
        {/* Profile Header Section */}
        <Card className="rounded-2xl border-border/40 mb-6">
          <CardContent className="p-8">
            <div className="flex items-start gap-8">
              {/* Avatar */}
              <div className="flex-shrink-0 relative group">
                {profile.profilePictureUrl ? (
                  <img 
                    src={profile.profilePictureUrl} 
                    alt="Profile" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-border/40"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl font-bold text-white">
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {uploadingImage ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                />
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  {profile.firstName} {profile.lastName}
                </h2>
                <div className="mb-4">
                  {getStatusBadge()}
                </div>
                <p className="text-muted-foreground mb-2">{profile.email}</p>
                {profile.city && (
                  <p className="text-sm text-muted-foreground">
                    📍 {profile.city}{profile.pinCode ? `, ${profile.pinCode}` : ''}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Personal Information */}
          <Card className="rounded-2xl border-border/40">
            <CardHeader>
              <CardTitle className="text-xl">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={profile.firstName} disabled className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={profile.lastName} disabled className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile.email} disabled className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={profile.gender} onValueChange={(value) => setProfile({ ...profile, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !profile.dateOfBirth && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {profile.dateOfBirth ? format(profile.dateOfBirth, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={profile.dateOfBirth}
                        onSelect={(date) => setProfile({ ...profile, dateOfBirth: date })}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    placeholder="Enter your city"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pin Code</Label>
                  <Input
                    value={profile.pinCode}
                    onChange={(e) => setProfile({ ...profile, pinCode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                    placeholder="6-digit pin code"
                    maxLength={6}
                  />
                </div>
              </div>

              <Button onClick={handleProfileUpdate} disabled={loading} className="w-full">
                {loading ? "Updating..." : "Update Profile"}
              </Button>
            </CardContent>
          </Card>

          {/* Right Column - Student Verification */}
          <Card className="rounded-2xl border-border/40">
            <CardHeader>
              <CardTitle className="text-xl">Student Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {verification.status === "approved" && (
                <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                  <p className="text-green-600 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    You are verified as a student! You can now apply for projects.
                  </p>
                </div>
              )}

              {verification.status === "pending" && (
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                  <p className="text-yellow-600 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Your verification request is pending review. We'll notify you once it's processed.
                  </p>
                </div>
              )}

              {verification.status === "rejected" && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 space-y-2">
                  <p className="text-red-600 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Your verification was rejected.
                  </p>
                  {verification.rejectionReason && (
                    <p className="text-sm text-muted-foreground">Reason: {verification.rejectionReason}</p>
                  )}
                  <p className="text-sm text-muted-foreground">You can submit a new verification request below.</p>
                </div>
              )}

              {(verification.status === "not_submitted" || verification.status === "rejected") && (
                <>
                  <div className="space-y-2">
                    <Label>Institute Name *</Label>
                    <Input
                      value={verification.instituteName}
                      onChange={(e) => setVerification({ ...verification, instituteName: e.target.value })}
                      placeholder="Enter your institute name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Institute Email * (.edu or .ac.in)</Label>
                    <Input
                      type="email"
                      value={verification.instituteEmail}
                      onChange={(e) => setVerification({ ...verification, instituteEmail: e.target.value })}
                      placeholder="your.email@university.edu"
                    />
                    <p className="text-xs text-muted-foreground">
                      Must end with .edu or .ac.in for automatic verification
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Enrollment ID (Optional)</Label>
                    <Input
                      value={verification.enrollmentId}
                      onChange={(e) => setVerification({ ...verification, enrollmentId: e.target.value })}
                      placeholder="Enter your enrollment ID"
                    />
                  </div>

                  <Button
                    onClick={handleVerificationSubmit}
                    disabled={verificationLoading}
                    className="w-full"
                  >
                    {verificationLoading ? "Submitting..." : "Submit Verification Request"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
