import { useState } from 'react';
import { Check, Sparkles, Zap, Crown, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface CreditPlan {
  id: string;
  name: string;
  credits: number;
  price: number;
  icon: React.ElementType;
  popular?: boolean;
  features: string[];
  color: string;
}

const creditPlans: CreditPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 50,
    price: 50,
    icon: Zap,
    features: [
      '50 Credits',
      'Post 5 projects',
      'Place 5 bids',
      'Valid forever',
    ],
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'basic',
    name: 'Basic',
    credits: 100,
    price: 100,
    icon: Sparkles,
    features: [
      '100 Credits',
      'Post 10 projects',
      'Place 10 bids',
      'Valid forever',
    ],
    color: 'from-violet-500 to-purple-500',
  },
  {
    id: 'professional',
    name: 'Professional',
    credits: 250,
    price: 250,
    icon: Crown,
    popular: true,
    features: [
      '250 Credits',
      'Post 25 projects',
      'Place 25 bids',
      'Priority support',
      'Valid forever',
    ],
    color: 'from-primary to-accent',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 500,
    price: 500,
    icon: Gem,
    features: [
      '500 Credits',
      'Post 50 projects',
      'Place 50 bids',
      'Priority support',
      'Dedicated assistance',
      'Valid forever',
    ],
    color: 'from-amber-500 to-orange-500',
  },
];

const BuyCreditsPage = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePurchase = async (plan: CreditPlan) => {
    setSelectedPlan(plan.id);
    setIsLoading(true);
    
    // TODO: Integrate with Razorpay payment gateway
    toast({
      title: "Coming Soon!",
      description: "Payment integration is being set up. Stay tuned!",
    });
    
    setIsLoading(false);
    setSelectedPlan(null);
  };

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-3">Buy Credits</h1>
        <p className="text-muted-foreground">
          Power up your account with credits. Use them to post projects or place bids.
          <span className="block mt-1 text-sm font-medium text-primary">₹1 = 1 Credit</span>
        </p>
      </div>

      {/* Credit Info Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl p-6 border border-primary/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">How Credits Work</h3>
              <p className="text-sm text-muted-foreground">Post a project: 10 credits • Place a bid: 10 credits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {creditPlans.map((plan) => {
          const Icon = plan.icon;
          const isSelected = selectedPlan === plan.id;
          
          return (
            <Card 
              key={plan.id}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                plan.popular ? 'border-primary shadow-md ring-2 ring-primary/20' : 'border-border'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-4">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">₹{plan.price}</span>
                  <span className="text-muted-foreground ml-1">one-time</span>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-4">
                <ul className="space-y-2.5">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button 
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handlePurchase(plan)}
                  disabled={isLoading && isSelected}
                >
                  {isLoading && isSelected ? 'Processing...' : `Buy ${plan.credits} Credits`}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Custom Amount Section */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
          <div>
            <h3 className="font-semibold text-foreground mb-1">Need a custom amount?</h3>
            <p className="text-sm text-muted-foreground">Contact us for bulk credit purchases or enterprise plans.</p>
          </div>
          <Button variant="secondary">
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BuyCreditsPage;
