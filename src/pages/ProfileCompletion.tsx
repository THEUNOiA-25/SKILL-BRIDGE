import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const profileSchema = z.object({
  dateOfBirth: z.string().refine((date) => {
    const dob = new Date(date);
    const age = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return age >= 13 && age <= 120;
  }, 'You must be at least 13 years old'),
  gender: z.string().min(1, 'Please select a gender'),
  city: z.string().trim().min(2, 'City must be at least 2 characters').max(100),
});

const ProfileCompletion = () => {
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/signup');
      } else {
        setUserId(session.user.id);
        checkProfileStatus(session.user.id);
      }
    });
  }, [navigate]);

  const checkProfileStatus = async (uid: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('profile_completed')
      .eq('user_id', uid)
      .single();

    if (data?.profile_completed) {
      navigate('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast({
        title: 'Error',
        description: 'User session not found. Please log in again.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      // Validate form data
      profileSchema.parse({
        dateOfBirth,
        gender,
        city,
      });

      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          date_of_birth: dateOfBirth,
          gender: gender,
          city: city,
          profile_completed: true,
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      toast({
        title: 'Profile completed!',
        description: 'Welcome to THEUNOiA!',
      });

      navigate('/');
    } catch (error: any) {
      console.error('Profile completion error:', error);
      
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Update Failed',
          description: error.message || 'An error occurred while updating your profile',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    toast({
      title: 'Profile Incomplete',
      description: 'You can complete your profile later from settings.',
    });
    navigate('/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12 bg-muted/30">
      <div className="w-full max-w-[500px] space-y-8 bg-background p-8 rounded-2xl shadow-lg">
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-bold text-foreground">Complete Your Profile</h1>
          <p className="text-muted-foreground text-base">
            Just a few more details to personalize your experience
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={gender} onValueChange={setGender} required>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              type="text"
              placeholder="Your city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="h-11"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              className="flex-1 h-11 rounded-full"
              disabled={loading}
            >
              Skip for Now
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 text-base font-bold rounded-full"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileCompletion;
