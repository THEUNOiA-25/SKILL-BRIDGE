import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

const StudentVerificationPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ firstName: "", lastName: "", email: "" });
  const [verification, setVerification] = useState<any>(null);
  const [formData, setFormData] = useState({
    instituteName: "",
    instituteEmail: "",
    enrollmentId: "",
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [profileRes, verificationRes] = await Promise.all([
        supabase.from("user_profiles").select("*").eq("user_id", user?.id).single(),
        supabase.from("student_verifications").select("*").eq("user_id", user?.id).maybeSingle(),
      ]);

      if (profileRes.data) {
        setProfile({
          firstName: profileRes.data.first_name || "",
          lastName: profileRes.data.last_name || "",
          email: profileRes.data.email || "",
        });
      }

      if (verificationRes.data) {
        setVerification(verificationRes.data);
        setFormData({
          instituteName: verificationRes.data.institute_name || "",
          instituteEmail: verificationRes.data.institute_email || "",
          enrollmentId: verificationRes.data.enrollment_id || "",
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load verification data");
    }
  };

  const validateEmail = (email: string) => {
    const eduDomains = [".edu", ".ac.", ".edu."];
    return eduDomains.some((domain) => email.toLowerCase().includes(domain));
  };

  const handleSubmit = async () => {
    if (!formData.instituteName || !formData.instituteEmail) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!validateEmail(formData.instituteEmail)) {
      toast.error("Please use your institute email address (.edu or .ac domain)");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("student_verifications").upsert({
        user_id: user?.id,
        institute_name: formData.instituteName,
        institute_email: formData.instituteEmail,
        enrollment_id: formData.enrollmentId,
        verification_status: "pending",
      });

      if (error) throw error;

      toast.success("Verification request submitted successfully!");
      navigate("/profile");
    } catch (error) {
      console.error("Error submitting verification:", error);
      toast.error("Failed to submit verification request");
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "approved":
        return {
          icon: <CheckCircle2 className="h-4 w-4" />,
          variant: "default" as const,
          text: "Verified",
        };
      case "pending":
        return {
          icon: <Clock className="h-4 w-4" />,
          variant: "secondary" as const,
          text: "Pending",
        };
      case "rejected":
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          variant: "destructive" as const,
          text: "Rejected",
        };
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          variant: "outline" as const,
          text: "Not Verified",
        };
    }
  };

  const canSubmit = !verification || verification.verification_status === "rejected";
  const statusInfo = verification ? getStatusInfo(verification.verification_status) : null;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        currentPath="/profile"
        displayName={`${profile.firstName} ${profile.lastName}`}
        displayEmail={profile.email}
        profilePictureUrl=""
        onSignOut={() => {}}
      />

      <main className="flex-1 p-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/profile")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Button>

        <Card className="max-w-2xl rounded-2xl border-border/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Student Verification</CardTitle>
                <CardDescription>
                  Verify your student status to access freelancer features
                </CardDescription>
              </div>
              {statusInfo && (
                <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                  {statusInfo.icon}
                  {statusInfo.text}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {verification?.verification_status === "pending" && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Your verification request is being reviewed. We'll notify you once it's processed.
                </p>
              </div>
            )}

            {verification?.verification_status === "approved" && (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Your student status has been verified! You now have access to all freelancer features.
                </p>
              </div>
            )}

            {verification?.verification_status === "rejected" && verification.rejection_reason && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                  Verification Rejected
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {verification.rejection_reason}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instituteName">Institute Name *</Label>
                <Input
                  id="instituteName"
                  value={formData.instituteName}
                  onChange={(e) =>
                    setFormData({ ...formData, instituteName: e.target.value })
                  }
                  placeholder="University of Example"
                  disabled={!canSubmit}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instituteEmail">Institute Email *</Label>
                <Input
                  id="instituteEmail"
                  type="email"
                  value={formData.instituteEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, instituteEmail: e.target.value })
                  }
                  placeholder="student@university.edu"
                  disabled={!canSubmit}
                />
                <p className="text-xs text-muted-foreground">
                  Must be an educational email (.edu or .ac domain)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="enrollmentId">Enrollment ID (Optional)</Label>
                <Input
                  id="enrollmentId"
                  value={formData.enrollmentId}
                  onChange={(e) =>
                    setFormData({ ...formData, enrollmentId: e.target.value })
                  }
                  placeholder="STU123456"
                  disabled={!canSubmit}
                />
              </div>
            </div>

            {canSubmit && (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Submitting..." : "Submit Verification Request"}
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentVerificationPage;
