import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import slide1 from '@/assets/auth-slide-1.png';
import slide2 from '@/assets/auth-slide-2.png';
import slide3 from '@/assets/auth-slide-3.png';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const signupSchema = z.object({
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters').max(50),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  userType: z.enum(['student', 'non-student'], {
    required_error: 'Please select a user type',
  }),
});

const Signup = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'student' | 'non-student'>('student');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const slides = [slide1, slide2, slide3];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      signupSchema.parse({
        firstName,
        lastName,
        email,
        password,
        userType,
      });

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Signup failed');

      // Create minimal user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          email: email,
          user_type: userType,
          profile_completed: false,
        });

      if (profileError) throw profileError;

      toast({
        title: 'Account created successfully!',
        description: 'Please complete your profile to continue.',
      });

      // Redirect to profile completion
      navigate('/profile-completion');
    } catch (error: any) {
      console.error('Signup error:', error);
      
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Signup Failed',
          description: error.message || 'An error occurred during signup',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Branding & Images */}
      <div className="hidden lg:flex lg:w-1/2 bg-muted flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/92d972effd43063f68165dc5639029d3b68f7576?placeholderIfAbsent=true"
            alt="THEUNOiA Logo"
            className="w-[30px] h-[24px]"
          />
          <span className="text-xl font-bold text-foreground">THEUNOiA</span>
        </div>

        <div className="space-y-6">
          <div className="bg-transparent rounded-3xl p-4 relative overflow-hidden">
            <div className="relative h-[550px] w-full flex items-center justify-center">
              {slides.map((slide, index) => (
                <img
                  key={index}
                  src={slide}
                  alt={`Slide ${index + 1}`}
                  className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ mixBlendMode: 'multiply' }}
                />
              ))}
            </div>
          </div>
          
          <blockquote className="space-y-2">
            <p className="text-muted-foreground text-base leading-relaxed">
              "THEUNOiA has transformed how my team collaborates! The intuitive task board and real-time updates keep everyone on the same page."
            </p>
            <footer className="text-sm text-foreground font-medium">- Sofia Davis, Product Manager</footer>
          </blockquote>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-end p-6">
          <Link to="/login">
            <Button variant="ghost" className="text-base font-medium">
              Login
            </Button>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[450px] space-y-8">
            <div className="space-y-3 text-center">
              <h1 className="text-3xl font-bold text-foreground">Create an account</h1>
              <p className="text-muted-foreground text-base">
                Get started with just a few details
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-3">
                <Label>I am a</Label>
                <RadioGroup value={userType} onValueChange={(value) => setUserType(value as 'student' | 'non-student')}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="student" id="student" />
                    <Label htmlFor="student" className="flex-1 cursor-pointer">
                      <div className="font-medium">Student</div>
                      <div className="text-sm text-muted-foreground">Post projects and access freelancing features after verification</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="non-student" id="non-student" />
                    <Label htmlFor="non-student" className="flex-1 cursor-pointer">
                      <div className="font-medium">Non-Student</div>
                      <div className="text-sm text-muted-foreground">Post projects and hire freelancers only</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button type="submit" className="w-full h-11 text-base font-bold rounded-full" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              By clicking continue, you agree to our{' '}
              <Link to="/terms" className="underline underline-offset-4 hover:text-foreground">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="underline underline-offset-4 hover:text-foreground">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
