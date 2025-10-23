import { useEffect, useState } from "react";
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
import { CalendarIcon, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);

  // Profile state
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    gender: "",
    city: "",
    pinCode: "",
    dateOfBirth: undefined as Date | undefined,
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-border/40 bg-card/30 backdrop-blur-sm">
        <h1 className="text-2xl font-semibold text-foreground">Profile Settings</h1>
        <Button variant="outline" onClick={() => signOut()}>
          Logout
        </Button>
      </div>

      {/* Content */}
      <div className="container mx-auto p-8 max-w-4xl">
        <div className="space-y-6">
          {/* Personal Information Card */}
          <Card className="rounded-2xl border-border/40">
            <CardHeader>
              <CardTitle className="text-xl">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={profile.firstName} disabled className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={profile.lastName} disabled className="bg-muted/50" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile.email} disabled className="bg-muted/50" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <Button onClick={handleProfileUpdate} disabled={loading} className="w-full md:w-auto">
                {loading ? "Updating..." : "Update Profile"}
              </Button>
            </CardContent>
          </Card>

          {/* Student Verification Card */}
          <Card className="rounded-2xl border-border/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Student Verification</CardTitle>
                {getStatusBadge()}
              </div>
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
                    className="w-full md:w-auto"
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
  );
};

export default ProfilePage;
