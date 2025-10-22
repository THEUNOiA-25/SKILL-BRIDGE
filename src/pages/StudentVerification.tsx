import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

const studentVerificationSchema = z.object({
  instituteName: z.string().trim().min(2, 'Institute name must be at least 2 characters').max(200),
  enrollmentId: z.string().trim().max(100).optional(),
  instituteEmail: z.string().trim().email('Invalid email address').optional(),
}).refine((data) => data.enrollmentId || data.instituteEmail, {
  message: 'Please provide either Enrollment ID or Institute Email',
  path: ['enrollmentId'],
});

const StudentVerification = () => {
  const [instituteName, setInstituteName] = useState('');
  const [enrollmentId, setEnrollmentId] = useState('');
  const [instituteEmail, setInstituteEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is logged in and get their profile
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate('/login');
        return;
      }

      setUserId(session.user.id);

      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('user_id', session.user.id)
        .single();

      setUserType(profile?.user_type || null);

      // Check existing verification status
      const { data: verification } = await supabase
        .from('student_verifications')
        .select('verification_status')
        .eq('user_id', session.user.id)
        .single();

      setVerificationStatus(verification?.verification_status || null);
    });
  }, [navigate]);

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
      studentVerificationSchema.parse({
        instituteName,
        enrollmentId: enrollmentId || undefined,
        instituteEmail: instituteEmail || undefined,
      });

      // Submit student verification
      const { error: verificationError } = await supabase
        .from('student_verifications')
        .upsert({
          user_id: userId,
          institute_name: instituteName,
          enrollment_id: enrollmentId || null,
          institute_email: instituteEmail || null,
          verification_status: 'pending',
        });

      if (verificationError) throw verificationError;

      // Update user type to student if they weren't already
      if (userType !== 'student') {
        await supabase
          .from('user_profiles')
          .update({ user_type: 'student' })
          .eq('user_id', userId);
      }

      toast({
        title: 'Verification Submitted!',
        description: 'Your student verification request has been submitted. You will be notified once approved.',
      });

      setVerificationStatus('pending');
    } catch (error: any) {
      console.error('Student verification error:', error);
      
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Submission Failed',
          description: error.message || 'An error occurred while submitting your verification',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (verificationStatus) {
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending Review
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            Verified
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12 bg-muted/30">
      <div className="w-full max-w-[550px] space-y-8 bg-background p-8 rounded-2xl shadow-lg">
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-bold text-foreground">Student Verification</h1>
          <p className="text-muted-foreground text-base">
            Verify your student status to unlock freelancing features
          </p>
          {verificationStatus && (
            <div className="flex justify-center pt-2">
              {getStatusBadge()}
            </div>
          )}
        </div>

        {verificationStatus === 'approved' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your student status is verified! You now have access to freelancing features.
            </AlertDescription>
          </Alert>
        )}

        {verificationStatus === 'pending' && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Your verification is under review. You will be notified once an admin approves your request.
            </AlertDescription>
          </Alert>
        )}

        {verificationStatus === 'rejected' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Your verification was rejected. Please submit again with correct information.
            </AlertDescription>
          </Alert>
        )}

        {(!verificationStatus || verificationStatus === 'rejected') && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="instituteName">Institute Name *</Label>
              <Input
                id="instituteName"
                type="text"
                placeholder="University or College name"
                value={instituteName}
                onChange={(e) => setInstituteName(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="enrollmentId">Enrollment ID</Label>
              <Input
                id="enrollmentId"
                type="text"
                placeholder="Your enrollment/student ID"
                value={enrollmentId}
                onChange={(e) => setEnrollmentId(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instituteEmail">Institute Email</Label>
              <Input
                id="instituteEmail"
                type="email"
                placeholder="your.name@university.edu"
                value={instituteEmail}
                onChange={(e) => setInstituteEmail(e.target.value)}
                className="h-11"
              />
            </div>

            <p className="text-sm text-muted-foreground">
              * Provide either Enrollment ID or Institute Email for verification
            </p>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1 h-11 rounded-full"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 text-base font-bold rounded-full"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Verification'}
              </Button>
            </div>
          </form>
        )}

        {verificationStatus === 'approved' && (
          <Button
            onClick={() => navigate('/')}
            className="w-full h-11 text-base font-bold rounded-full"
          >
            Go to Dashboard
          </Button>
        )}
      </div>
    </div>
  );
};

export default StudentVerification;
