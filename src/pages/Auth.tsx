import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Mail, Lock, User, GraduationCap, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const location = useLocation();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<"hirer" | "freelancer" | "both">(
    location.state?.role || "hirer"
  );
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Set mode based on route
  useEffect(() => {
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
        // Sign up - trigger will automatically create profile, role, and freelancer_profile
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password: password.trim(),
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
            data: {
              full_name: fullName,
              department: department,
              role: role, // Pass role to trigger
            }
          }
        });

        if (signUpError) throw signUpError;

        toast({
          title: "Account created successfully!",
          description: "Redirecting to sign in...",
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
          if (signInError.message.includes("Invalid login credentials")) {
            throw new Error("Invalid email or password. Please check your credentials.");
          }
          throw signInError;
        }

        // Get user role(s)
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);

        if (roleError || !roleData || roleData.length === 0) {
          throw new Error("User role not found. Please contact support.");
        }

        // Get active role or use first role
        const { data: profileData } = await supabase
          .from('profiles')
          .select('active_role')
          .eq('id', data.user.id)
          .single();

        const activeRole = profileData?.active_role || roleData[0].role;

        toast({
          title: "Welcome back!",
          description: "Redirecting to your dashboard...",
        });

        // Navigate to appropriate dashboard
        navigate(activeRole === "freelancer" ? "/freelancer/dashboard" : "/hirer/dashboard");
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

  const sideContent = {
    hirer: {
      title: "Get Reliable Help",
      desc: "Connect with top-rated peers for your assignments and academic tasks.",
      points: ["Post jobs in minutes", "Choose from verified students", "Track progress live", "Transparent pricing"]
    },
    freelancer: {
      title: "Turn Skills into Income",
      desc: "Show your skills, earn money, and grow your reputation on campus.",
      points: ["Set your own rates", "Choose your workload", "Build your profile", "Get paid securely"]
    },
    both: {
      title: "Maximum Flexibility",
      desc: "Get help when you need it, and earn money when you're free.",
      points: ["Post jobs as a hirer", "Take jobs as a freelancer", "One account, dual benefits", "Switch roles anytime"]
    }
  };

  const currentSide = role === "both" ? sideContent.both : sideContent[role];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-5xl">
        <Card className="overflow-hidden shadow-2xl">
          <div className="grid md:grid-cols-2">
            {/* Left Side - Form */}
            <div className="p-12">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">
                  {mode === "login" ? "Welcome back" : "Join PeerHire"}
                </h1>
                <p className="text-muted-foreground">
                  {mode === "login" ? "Sign in to your account" : "Create your account to get started"}
                </p>
              </div>

              {/* Role Toggle */}
              {mode === "signup" && (
                <div className="space-y-4 mb-8">
                  <p className="text-sm font-medium text-center">I want to join as:</p>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("hirer")}
                      className={`p-4 rounded-xl border-2 transition-all ${role === "hirer"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                        }`}
                    >
                      <GraduationCap className="w-6 h-6 mx-auto mb-2" />
                      <p className="font-semibold text-sm">Hirer</p>
                      <p className="text-xs text-muted-foreground">Get help</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("freelancer")}
                      className={`p-4 rounded-xl border-2 transition-all ${role === "freelancer"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                        }`}
                    >
                      <User className="w-6 h-6 mx-auto mb-2" />
                      <p className="font-semibold text-sm">Freelancer</p>
                      <p className="text-xs text-muted-foreground">Earn money</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("both")}
                      className={`p-4 rounded-xl border-2 transition-all ${role === "both"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                        }`}
                    >
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <GraduationCap className="w-5 h-5" />
                        <User className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-sm">Both</p>
                      <p className="text-xs text-muted-foreground">Do both</p>
                    </button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">You can add the other role later from settings</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="name"
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
                  <Label htmlFor="email">University Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@aaub.edu.bd"
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
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
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      name="department"
                      type="text"
                      placeholder="e.g., CSE, EEE, AVE"
                      className="h-12"
                      required
                    />
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
                  <h2 className="text-3xl font-bold mb-3">{currentSide.title}</h2>
                  <p className="text-muted-foreground text-lg">{currentSide.desc}</p>
                </div>

                <div className="space-y-4 pt-6">
                  {currentSide.points.map((point, idx) => (
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
  );
};

export default Auth;