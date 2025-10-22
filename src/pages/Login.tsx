import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import slide1 from '@/assets/auth-slide-1.png';
import slide2 from '@/assets/auth-slide-2.png';
import slide3 from '@/assets/auth-slide-3.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });

      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid email or password',
        variant: 'destructive',
      });
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
              "Getting things done is simple. Just post what you need, receive bids from skilled individuals, and pick the one that fits your budget."
            </p>
            <footer className="text-sm text-foreground font-medium">- James Patterson, Tech Lead</footer>
          </blockquote>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-end p-6">
          <Link to="/signup">
            <Button variant="ghost" className="text-base font-medium">
              Sign Up
            </Button>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-6">
          <div className="w-full max-w-[400px] space-y-8">
            <div className="space-y-3 text-center">
              <h1 className="text-3xl font-bold text-foreground">Welcome back</h1>
              <p className="text-muted-foreground text-base">
                Enter your email below to login to your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <Button type="submit" className="w-full h-12 text-base font-bold rounded-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In with Email'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="underline underline-offset-4 hover:text-foreground font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
