import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, X } from "lucide-react";
import { toast } from "sonner";

const SKILLS_STORAGE_KEY = (userId: string) => `profile_role_skills_${userId}`;

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    gender: "",
    dateOfBirth: null as Date | null,
    city: "",
    pinCode: "",
    bio: "",
    phone: "",
    website: "",
    billingAddress: "",
  });
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    if (!user) return;

    // First name, last name, email from account creation (auth) — show immediately
    const meta = user.user_metadata as { firstName?: string; lastName?: string } | undefined;
    setProfile((prev) => ({
      ...prev,
      firstName: meta?.firstName ?? prev.firstName,
      lastName: meta?.lastName ?? prev.lastName,
      email: user.email ?? prev.email,
    }));

    fetchProfile();
    try {
      const raw = localStorage.getItem(SKILLS_STORAGE_KEY(user.id));
      if (raw) {
        const parsed = JSON.parse(raw) as { role?: string; skills?: string[] };
        if (parsed.role) setRole(parsed.role);
        if (Array.isArray(parsed.skills)) setSkills(parsed.skills);
      }
    } catch {
      // ignore invalid stored data
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.id) return;

    // First name, last name, email come from account creation (auth), read-only
    const meta = user.user_metadata as { firstName?: string; lastName?: string } | undefined;
    const fromAuth = {
      firstName: meta?.firstName ?? "",
      lastName: meta?.lastName ?? "",
      email: user.email ?? "",
    };

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      const row = data;
      setProfile({
        ...fromAuth,
        gender: row?.gender || "",
        dateOfBirth: row?.date_of_birth ? new Date(row.date_of_birth) : null,
        city: row?.city || "",
        pinCode: row?.pin_code || "",
        bio: row?.bio || "",
        phone: row?.phone || "",
        website: row?.website || "",
        billingAddress: row?.billing_address || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      // Still show name/email from auth even if user_profiles fails
      setProfile((prev) => ({ ...prev, ...fromAuth }));
      toast.error("Failed to load profile data");
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          gender: profile.gender,
          date_of_birth: profile.dateOfBirth?.toISOString().split("T")[0],
          city: profile.city,
          pin_code: profile.pinCode,
          bio: profile.bio,
          phone: profile.phone,
          website: profile.website,
          billing_address: profile.billingAddress,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      localStorage.setItem(
        SKILLS_STORAGE_KEY(user.id),
        JSON.stringify({ role, skills })
      );

      toast.success("Profile updated successfully!");
      navigate("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (skills.includes(trimmed)) {
      toast.error("Skill already added");
      return;
    }
    setSkills((prev) => [...prev, trimmed]);
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  return (
    <main className="flex-1 p-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/profile")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Button>

        <Card className="max-w-3xl rounded-2xl border-border/40">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">Name and email are from your account and cannot be changed here.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profile.firstName}
                  readOnly
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profile.lastName}
                  readOnly
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                readOnly
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={profile.gender}
                onValueChange={(value) =>
                  setProfile({ ...profile, gender: value })
                }
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <div className="grid grid-cols-3 gap-3">
                <Select
                  value={profile.dateOfBirth ? profile.dateOfBirth.getFullYear().toString() : ""}
                  onValueChange={(year) => {
                    const currentDate = profile.dateOfBirth || new Date();
                    const newDate = new Date(
                      parseInt(year),
                      currentDate.getMonth(),
                      Math.min(currentDate.getDate(), new Date(parseInt(year), currentDate.getMonth() + 1, 0).getDate())
                    );
                    setProfile({ ...profile, dateOfBirth: newDate });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={profile.dateOfBirth ? profile.dateOfBirth.getMonth().toString() : ""}
                  onValueChange={(month) => {
                    const currentDate = profile.dateOfBirth || new Date();
                    const year = currentDate.getFullYear();
                    const newDate = new Date(
                      year,
                      parseInt(month),
                      Math.min(currentDate.getDate(), new Date(year, parseInt(month) + 1, 0).getDate())
                    );
                    setProfile({ ...profile, dateOfBirth: newDate });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={profile.dateOfBirth ? profile.dateOfBirth.getDate().toString() : ""}
                  onValueChange={(day) => {
                    const currentDate = profile.dateOfBirth || new Date();
                    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), parseInt(day));
                    setProfile({ ...profile, dateOfBirth: newDate });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {Array.from(
                      { length: profile.dateOfBirth 
                        ? new Date(profile.dateOfBirth.getFullYear(), profile.dateOfBirth.getMonth() + 1, 0).getDate() 
                        : 31 
                      },
                      (_, i) => i + 1
                    ).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={profile.city}
                  onChange={(e) =>
                    setProfile({ ...profile, city: e.target.value })
                  }
                  placeholder="Enter your city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pinCode">Pin Code</Label>
                <Input
                  id="pinCode"
                  value={profile.pinCode}
                  onChange={(e) =>
                    setProfile({ ...profile, pinCode: e.target.value })
                  }
                  placeholder="Enter pin code"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-secondary-foreground">
                Role (for job matching)
              </Label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Frontend Developer, Backend Developer"
                className="bg-secondary/15 border-secondary/30 text-secondary-foreground placeholder:text-secondary-foreground/60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills" className="text-primary">
                Skills (for job matching)
              </Label>
              <p className="text-xs text-muted-foreground">
                Add skills like React, TypeScript, Node.js, etc. They help match you with relevant projects.
              </p>
              <div className="flex gap-2">
                <Input
                  id="skills"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="e.g. React, Node.js, Python"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={addSkill}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-primary/15 text-primary border border-primary/30"
                    >
                      {skill}
                      <button
                        type="button"
                        className="rounded-full p-0.5 hover:bg-primary/20"
                        onClick={() => removeSkill(skill)}
                        aria-label={`Remove ${skill}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) =>
                  setProfile({ ...profile, bio: e.target.value })
                }
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={profile.website}
                onChange={(e) =>
                  setProfile({ ...profile, website: e.target.value })
                }
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingAddress">Billing Address</Label>
              <Textarea
                id="billingAddress"
                value={profile.billingAddress}
                onChange={(e) =>
                  setProfile({ ...profile, billingAddress: e.target.value })
                }
                placeholder="Enter your billing address"
                rows={3}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
    </main>
  );
};

export default EditProfilePage;
