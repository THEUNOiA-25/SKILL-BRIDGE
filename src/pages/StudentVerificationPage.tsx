import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, AlertCircle, CheckCircle2, Clock, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const StudentVerificationPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ firstName: "", lastName: "", email: "" });
  const [verification, setVerification] = useState<any>(null);
  const [colleges, setColleges] = useState<any[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<string>("");
  const [formData, setFormData] = useState({
    instituteEmail: "",
    enrollmentId: "",
  });
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user?.id) return;
    
    try {
      const [profileRes, verificationRes, collegesRes] = await Promise.all([
        supabase.from("user_profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("student_verifications").select("*, colleges(*)").eq("user_id", user.id).maybeSingle(),
        supabase.from("colleges").select("*").order("name"),
      ]);

      if (profileRes.data) {
        setProfile({
          firstName: profileRes.data.first_name || "",
          lastName: profileRes.data.last_name || "",
          email: profileRes.data.email || "",
        });
      }

      if (collegesRes.data) {
        setColleges(collegesRes.data);
      }

      if (verificationRes.data) {
        setVerification(verificationRes.data);
        setSelectedCollege(verificationRes.data.college_id || "");
        setFormData({
          instituteEmail: verificationRes.data.institute_email || "",
          enrollmentId: verificationRes.data.enrollment_id || "",
        });
        
        // Load ID card if exists
        if (verificationRes.data.id_card_url) {
          try {
            const { data: signedUrlData } = await supabase.storage
              .from('student-id-cards')
              .createSignedUrl(verificationRes.data.id_card_url, 3600);
            
            if (signedUrlData?.signedUrl) {
              setIdCardPreview(signedUrlData.signedUrl);
            }
          } catch (error) {
            console.error('Error loading ID card:', error);
          }
        }
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPG, PNG, or WEBP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIdCardFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setIdCardPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setIdCardFile(null);
    setIdCardPreview("");
  };

  const uploadIdCard = async (): Promise<string | null> => {
    if (!idCardFile || !user?.id) return null;

    setUploading(true);
    try {
      const fileExt = idCardFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('student-id-cards')
        .upload(fileName, idCardFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // For non-public bucket, use the path directly (URL will be handled via RLS)
      return data.path;
    } catch (error) {
      console.error('Error uploading ID card:', error);
      toast.error('Failed to upload ID card');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    if (!selectedCollege) {
      toast.error("Please select your college");
      return;
    }

    // Validate that either email OR ID card is provided
    const hasValidEmail = formData.instituteEmail && validateEmail(formData.instituteEmail);
    const hasIdCard = idCardFile || idCardPreview;

    if (!hasValidEmail && !hasIdCard) {
      toast.error("Please provide either a valid institute email (.edu or .ac domain) OR upload your student ID card");
      return;
    }

    setLoading(true);
    try {
      let idCardUrl = idCardPreview || null;
      
      // Upload new ID card if provided
      if (idCardFile) {
        const uploadedUrl = await uploadIdCard();
        if (uploadedUrl) {
          idCardUrl = uploadedUrl;
        } else {
          setLoading(false);
          return; // Upload failed, don't proceed
        }
      }

      const verificationData: any = {
        user_id: user.id,
        college_id: selectedCollege,
        institute_email: formData.instituteEmail || null,
        enrollment_id: formData.enrollmentId || null,
        verification_status: "pending",
        id_card_url: idCardUrl,
        verification_method: hasValidEmail ? 'email' : 'id_card',
      };

      const { error } = await supabase.from("student_verifications").upsert(verificationData);

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

  // Allow submission if: no verification, rejected, or missing required fields like college_id
  const canSubmit = !verification || 
                    verification.verification_status === "rejected" ||
                    !verification.college_id;
  const statusInfo = verification ? getStatusInfo(verification.verification_status) : null;

  return (
    <main className="flex-1 p-8 ml-64">
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

            {verification?.verification_status === "approved" && verification.college_id && (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Your student status has been verified! You now have access to all freelancer features.
                </p>
              </div>
            )}

            {verification?.verification_status === "approved" && !verification.college_id && (
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  Update Required
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Please select your college to complete your verification and access community features.
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
                <Label htmlFor="college">College/University *</Label>
                {verification?.verification_status === "approved" && verification.college_id && verification.colleges ? (
                  <div className="p-3 border border-border rounded-md bg-muted/50">
                    <p className="text-sm font-medium">
                      {verification.colleges.name} - {verification.colleges.city}, {verification.colleges.state}
                    </p>
                  </div>
                ) : (
                  <Select 
                    value={selectedCollege} 
                    onValueChange={setSelectedCollege}
                    disabled={!canSubmit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your college" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {colleges.map((college) => (
                        <SelectItem key={college.id} value={college.id}>
                          {college.name} - {college.city}, {college.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  Can't find your college? Contact support to add it.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instituteEmail">
                  Institute Email {!idCardFile && !idCardPreview && "*"}
                </Label>
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
                  Educational email (.edu or .ac domain) OR upload ID card below
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idCard">
                  Student ID Card {!formData.instituteEmail && "*"}
                </Label>
                <div className="space-y-3">
                  {idCardPreview ? (
                    <div className="relative border-2 border-dashed border-border rounded-lg p-4">
                      <img
                        src={idCardPreview}
                        alt="ID Card Preview"
                        className="max-w-full h-auto max-h-64 mx-auto rounded-lg"
                      />
                      {canSubmit && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={handleRemoveFile}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                      <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload your student ID card
                      </p>
                      <Input
                        id="idCard"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleFileSelect}
                        disabled={!canSubmit}
                        className="hidden"
                      />
                      <Label
                        htmlFor="idCard"
                        className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md cursor-pointer ${
                          canSubmit
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                        }`}
                      >
                        Choose File
                      </Label>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    If you don't have an educational email, upload a clear photo of your student ID card (JPG, PNG, or WEBP, max 5MB)
                  </p>
                </div>
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
                disabled={loading || uploading}
                className="w-full"
              >
                {uploading
                  ? "Uploading..."
                  : loading
                  ? "Submitting..."
                  : "Submit Verification Request"}
              </Button>
            )}
          </CardContent>
        </Card>
    </main>
  );
};

export default StudentVerificationPage;
