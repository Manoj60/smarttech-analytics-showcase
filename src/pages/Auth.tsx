import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    // Add noindex meta tag for SEO
    document.title = "Sign In | Smart Tech Analytics";
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex, nofollow';
    document.head.appendChild(metaRobots);

    // Handle email confirmation tokens
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    
    if (token_hash && type) {
      supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      }).then(({ data, error }) => {
        if (error) {
          console.error('Email confirmation error:', error);
          toast({
            title: "Confirmation Failed",
            description: "Invalid or expired confirmation link.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Email Confirmed",
            description: "Your email has been confirmed successfully. You can now sign in.",
          });
        }
      });
    }

    return () => {
      // Cleanup meta tag
      const existingMeta = document.querySelector('meta[name="robots"][content="noindex, nofollow"]');
      if (existingMeta) {
        document.head.removeChild(existingMeta);
      }
    };
  }, [searchParams, toast]);

  useEffect(() => {
    // Redirect authenticated users
    if (user) {
      if (isAdmin()) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }
  }, [user, isAdmin, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signIn(email, password);
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signUp(email, password, fullName);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="py-20 gradient-hero">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-primary-foreground">
            <h1 className="text-4xl lg:text-6xl font-heading font-bold mb-6">
              Welcome Back
            </h1>
            <p className="text-xl lg:text-2xl text-primary-light leading-relaxed">
              Sign in to access your admin dashboard and manage your platform with powerful tools.
            </p>
          </div>
        </div>
      </section>

      {/* Auth Form Section */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card className="gradient-card border-border shadow-strong">
              <CardHeader>
                <CardTitle className="text-2xl text-center font-heading text-foreground">Authentication</CardTitle>
                <CardDescription className="text-center text-muted-foreground">
                  Choose your authentication method below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-secondary">
                    <TabsTrigger value="signin" className="text-foreground">Sign In</TabsTrigger>
                    <TabsTrigger value="signup" className="text-foreground">Sign Up</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="signin" className="mt-6">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email" className="text-foreground">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password" className="text-foreground">Password</Label>
                        <Input
                          id="signin-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Signing In..." : "Sign In"}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="signup" className="mt-6">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-fullname" className="text-foreground">Full Name</Label>
                        <Input
                          id="signup-fullname"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-foreground">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-foreground">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Creating Account..." : "Sign Up"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Auth;