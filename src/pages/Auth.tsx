import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Mail, Lock, User, Eye, EyeOff, BookOpen, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const location = useLocation();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);

  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Signup Request State
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [batch, setBatch] = useState("");

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Set mode based on route
  useEffect(() => {
    setError("");
    if (location.pathname === "/signup") {
      setMode("signup");
    } else if (location.pathname === "/login") {
      setMode("login");
    }
  }, [location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await handlePostAuth(data.user.id);
      }
    } catch (error: any) {
      setError(error.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupRequest = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate inputs
    if (!fullName || !department || !batch) {
      setError("Please fill in all fields");
      return;
    }

    // Navigate to Contact Developer page with data
    navigate("/auth/contact-developer", {
      state: {
        name: fullName,
        department,
        batch,
      }
    });
  };

  const handlePostAuth = async (userId: string) => {
    try {
      // Check/Create Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_hirer, is_freelancer')
        .eq('id', userId)
        .single();

      // If no profile, create one
      if (profileError || !profileData) {
        await supabase.from('profiles').upsert({
          id: userId,
          email: email, // from state
          full_name: email.split('@')[0],
          is_hirer: true,
          is_freelancer: true
        });
      }

      // Set default role
      localStorage.setItem('activeRole', 'hirer');

      toast({
        title: "Welcome back!",
        description: "Redirecting to dashboard...",
      });

      navigate("/hirer/dashboard");
    } catch (error) {
      console.error("Post-auth error:", error);
      navigate("/hirer/dashboard");
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
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary-foreground">P</span>
              </div>
              <h1 className="text-2xl font-bold">
                {mode === "login" ? "Welcome Back" : "Join PeerHire"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {mode === "login" ? "Sign in with your university credentials" : "Request access to the platform"}
              </p>
            </div>

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">University Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@aaub.edu.bd"
                      className="pl-10 h-11"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-11"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>}

                <Button type="submit" className="w-full h-11 font-medium btn-glow" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignupRequest} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="John Doe"
                      className="pl-10 h-11"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="department">Department</Label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="department"
                      placeholder="CSE"
                      className="pl-10 h-11"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="batch">Batch</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="batch"
                      placeholder="Summer 24"
                      className="pl-10 h-11"
                      required
                      value={batch}
                      onChange={(e) => setBatch(e.target.value)}
                    />
                  </div>
                </div>

                {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>}

                <Button type="submit" className="w-full h-11 font-medium btn-glow">
                  Request Access
                </Button>
              </form>
            )}

            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => {
                    const newMode = mode === "login" ? "signup" : "login";
                    setMode(newMode);
                    navigate(newMode === "login" ? "/login" : "/signup");
                  }}
                  className="text-primary font-medium hover:underline"
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </div>

          {/* Desktop Layout - Split Screen */}
          <div className="hidden md:grid md:grid-cols-2 gap-0 overflow-hidden rounded-3xl border border-border bg-card shadow-2xl min-h-[600px]">
            {/* Left Side - Form */}
            <div className="p-10 flex flex-col justify-center">
              <div className="mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4">
                  <span className="text-xl font-bold text-primary-foreground">P</span>
                </div>
                <h1 className="text-3xl font-bold mb-2">
                  {mode === "login" ? "Welcome Back" : "Join PeerHire"}
                </h1>
                <p className="text-muted-foreground">
                  {mode === "login" ? "Sign in to access your dashboard" : "Join the exclusive community for AAUB students"}
                </p>
              </div>

              {mode === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="desktop-email">University Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="desktop-email"
                        type="email"
                        placeholder="you@aaub.edu.bd"
                        className="pl-10 h-11"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="desktop-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="desktop-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-11"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>}

                  <Button type="submit" className="w-full h-11 font-medium btn-glow" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignupRequest} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="desktop-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="desktop-name"
                        placeholder="John Doe"
                        className="pl-10 h-11"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="desktop-department">Department</Label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="desktop-department"
                        placeholder="CSE"
                        className="pl-10 h-11"
                        required
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="desktop-batch">Batch</Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="desktop-batch"
                        placeholder="Summer 24"
                        className="pl-10 h-11"
                        required
                        value={batch}
                        onChange={(e) => setBatch(e.target.value)}
                      />
                    </div>
                  </div>

                  {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>}

                  <Button type="submit" className="w-full h-11 font-medium btn-glow">
                    Request Access
                  </Button>
                </form>
              )}

              <div className="text-center pt-6">
                <p className="text-sm text-muted-foreground">
                  {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => {
                      const newMode = mode === "login" ? "signup" : "login";
                      setMode(newMode);
                      navigate(newMode === "login" ? "/login" : "/signup");
                    }}
                    className="text-primary font-medium hover:underline"
                  >
                    {mode === "login" ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </div>
            </div>

            {/* Right Side - Image/Decoration */}
            <div className="relative bg-muted">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 backdrop-blur-3xl" />
              <div className="absolute inset-0 flex items-center justify-center p-12">
                <div className="relative w-full aspect-square max-w-[400px]">
                  {/* Abstract shapes or placeholder for auth image */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/30 rounded-full blur-3xl animate-pulse" />
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000" />

                  <div className="relative z-10 glass-panel p-8 rounded-2xl border-white/10">
                    <div className="space-y-4">
                      <div className="h-2 w-20 bg-primary/20 rounded-full" />
                      <div className="h-2 w-32 bg-primary/10 rounded-full" />
                      <div className="h-24 w-full bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-xl border border-white/5" />
                      <div className="flex gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/20" />
                        <div className="space-y-1">
                          <div className="h-2 w-24 bg-primary/10 rounded-full" />
                          <div className="h-2 w-16 bg-primary/5 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;