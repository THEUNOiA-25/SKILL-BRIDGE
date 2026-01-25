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
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

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

  useEffect(() => {
    if (user) {
      fetchProfile();
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
          gender: data.gender || "",
          dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : null,
          city: data.city || "",
          pinCode: data.pin_code || "",
          bio: data.bio || "",
          phone: data.phone || "",
          website: data.website || "",
          billingAddress: data.billing_address || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
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

      toast.success("Profile updated successfully!");
      navigate("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profile.firstName}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profile.lastName}
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
