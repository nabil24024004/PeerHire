import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const location = useLocation();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Set mode based on route
  useEffect(() => {
    setError(""); // Clear error when switching modes
    setShowPassword(false); // Reset password visibility
    if (location.pathname === "/signup") {
      setMode("signup");
    } else if (location.pathname === "/login") {
      setMode("login");
    }
  }, [location]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("name") as string;
    const department = formData.get("department") as string;

    // Validate university email domain
    if (!email.endsWith("@aaub.edu.bd")) {
      setError("Please use your AAUB university email (@aaub.edu.bd)");
      setLoading(false);
      return;
    }

    // Validate password
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      if (mode === "signup") {
        // Sign up - everyone gets both roles automatically
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password: password.trim(),
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
            data: {
              full_name: fullName,
            }
          }
        });

        if (signUpError) throw signUpError;

        // Update profile with full_name (trigger creates profile but doesn't have access to metadata)
        if (data?.user) {
          await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', data.user.id);
        }

        toast({
          title: "Account created successfully!",
          description: "Please check your email to confirm your account.",
        });

        // Redirect to login after successful signup
        setTimeout(() => navigate("/login"), 1500);
      } else {
        // Sign in
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          if (signInError.message.includes("Email not confirmed")) {
            throw new Error("Please confirm your email before logging in. Check your inbox for the confirmation link.");
          }
          if (signInError.message.includes("Invalid login credentials")) {
            throw new Error("Invalid email or password. Please check your credentials.");
          }
          throw signInError;
        }

        // Get user profile with roles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_hirer, is_freelancer')
          .eq('id', data.user.id)
          .single();

        // If no profile or missing roles, create/update with both roles
        if (profileError || !profileData) {
          // No profile exists, create one with both roles
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: data.user.email,
            is_hirer: true,
            is_freelancer: true
          });
        } else if (!profileData.is_hirer && !profileData.is_freelancer) {
          // Profile exists but no roles - update to have both roles
          await supabase.from('profiles')
            .update({ is_hirer: true, is_freelancer: true })
            .eq('id', data.user.id);
        }

        // Set default role to hirer
        localStorage.setItem('activeRole', 'hirer');

        toast({
          title: "Welcome back!",
          description: "Redirecting to your dashboard...",
        });

        // Navigate to hirer dashboard by default (users can switch roles)
        navigate("/hirer/dashboard");
      }
    } catch (error: any) {
      setError(error.message || "An error occurred");
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Mobile Header */}
      <div className="px-6 pt-8 pb-4 md:hidden">
        <button
          onClick={() => navigate("/")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-6 md:p-6">
        <div className="w-full max-w-md md:max-w-5xl">
          {/* Mobile Layout */}
          <div className="md:hidden space-y-6">
            {/* Logo & Title */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary-foreground">P</span>
              </div>
              <h1 className="text-2xl font-bold">
                {mode === "login" ? "Welcome back" : "Join PeerHire"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {mode === "login" ? "Sign in to continue" : "Create your account"}
              </p>
            </div>

            {/* Mobile Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm">University Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@aaub.edu.bd"
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="department" className="text-sm">Department</Label>
                  <Input
                    id="department"
                    name="department"
                    type="text"
                    placeholder="e.g., CSE, EEE, AVE"
                    className="h-11"
                    required
                  />
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full h-11 font-medium btn-glow" disabled={loading}>
                {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-3 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>

              <p className="text-center text-sm text-muted-foreground pt-2">
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "login" ? "signup" : "login");
                    navigate(mode === "login" ? "/signup" : "/login");
                  }}
                  className="text-primary font-medium hover:underline"
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </form>

            {/* Mobile Footer */}
            <p className="text-xs text-center text-muted-foreground pt-4">
              Built for AAUB students. Verified with your .edu email.
            </p>
          </div>

          {/* Desktop Layout */}
          <Card className="hidden md:block overflow-hidden shadow-2xl">
            <div className="grid md:grid-cols-2">
              {/* Left Side - Form */}
              <div className="p-12">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold mb-2">
                    {mode === "login" ? "Welcome back" : "Join PeerHire"}
                  </h1>
                  <p className="text-muted-foreground">
                    {mode === "login" ? "Sign in to your account" : "Create your account with both hirer and freelancer access"}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {mode === "signup" && (
                    <div className="space-y-2">
                      <Label htmlFor="name-desktop">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="name-desktop"
                          name="name"
                          type="text"
                          placeholder="John Doe"
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email-desktop">University Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email-desktop"
                        name="email"
                        type="email"
                        placeholder="you@aaub.edu.bd"
                        className="pl-10 h-12"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-desktop">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password-desktop"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {mode === "signup" && (
                    <div className="space-y-2">
                      <Label htmlFor="department-desktop">Department</Label>
                      <Input
                        id="department-desktop"
                        name="department"
                        type="text"
                        placeholder="e.g., CSE, EEE, AVE"
                        className="h-12"
                        required
                      />
                    </div>
                  )}

                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  <Button type="submit" className="w-full h-12 text-lg btn-glow" disabled={loading}>
                    {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign {mode === "login" ? "in" : "up"} with Google
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setMode(mode === "login" ? "signup" : "login");
                        navigate(mode === "login" ? "/signup" : "/login");
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                  </div>
                </form>

                <div className="mt-8 text-center">
                  <button
                    onClick={() => navigate("/")}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Back to home
                  </button>
                </div>
              </div>

              {/* Right Side - Info */}
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-12 flex flex-col justify-center border-l border-border">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-3">Maximum Flexibility</h2>
                    <p className="text-muted-foreground text-lg">Get help when you need it, and earn money when you're free.</p>
                  </div>

                  <div className="space-y-4 pt-6">
                    {["Post jobs as a hirer", "Take jobs as a freelancer", "One account, dual benefits", "Switch roles anytime"].map((point, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        </div>
                        <p className="text-foreground">{point}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-8 border-t border-border/50">
                    <p className="text-sm text-muted-foreground">
                      Built exclusively for university students. Verified with your .edu email.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;