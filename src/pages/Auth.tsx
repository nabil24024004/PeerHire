import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
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
    if (!fullName || !department || !batch) {
      setError("Please fill in all fields");
      return;
    }
    navigate("/auth/contact-developer", {
      state: { name: fullName, department, batch }
    });
  };

  const handlePostAuth = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_hirer, is_freelancer')
        .eq('id', userId)
        .single();

      if (profileError || !profileData) {
        await supabase.from('profiles').upsert({
          id: userId,
          email: email,
          full_name: email.split('@')[0],
          is_hirer: true,
          is_freelancer: true
        });
      }
      localStorage.setItem('activeRole', 'hirer');
      toast({ title: "Welcome back!", description: "Redirecting to dashboard..." });
      navigate("/hirer/dashboard");
    } catch (error) {
      console.error("Post-auth error:", error);
      navigate("/hirer/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex bg-[#1a1a1a] text-white overflow-hidden">
      {/* Left Side - Form Area */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-12 xl:p-20 relative justify-center">
        {/* Back Button */}
        <div className="absolute top-8 left-8">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        </div>

        <div className="w-full max-w-md mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-white">
              {mode === "login" ? "Login" : "Sign up"}
            </h1>
            <p className="text-gray-400">
              {mode === "login" ? "Enter your account details" : "Enter your details to request access"}
            </p>
          </div>

          <form onSubmit={mode === "login" ? handleLogin : handleSignupRequest} className="space-y-8">
            {mode === "login" ? (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-400 text-xs uppercase tracking-wider">Username / Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@aaub.edu.bd"
                      className="bg-transparent border-0 border-b border-gray-700 rounded-none px-0 py-2 h-auto text-white placeholder:text-gray-600 focus-visible:ring-0 focus-visible:border-[#a855f7] transition-colors"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 relative">
                    <Label htmlFor="password" classname="text-gray-400 text-xs uppercase tracking-wider">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="bg-transparent border-0 border-b border-gray-700 rounded-none px-0 py-2 h-auto text-white placeholder:text-gray-600 focus-visible:ring-0 focus-visible:border-[#a855f7] transition-colors pr-8"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="button" className="text-xs text-gray-500 hover:text-gray-300">
                    Forgot Password?
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-400 text-xs uppercase tracking-wider">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    className="bg-transparent border-0 border-b border-gray-700 rounded-none px-0 py-2 h-auto text-white placeholder:text-gray-600 focus-visible:ring-0 focus-visible:border-[#a855f7] transition-colors"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="text-gray-400 text-xs uppercase tracking-wider">Department</Label>
                  <Input
                    id="department"
                    placeholder="CSE"
                    className="bg-transparent border-0 border-b border-gray-700 rounded-none px-0 py-2 h-auto text-white placeholder:text-gray-600 focus-visible:ring-0 focus-visible:border-[#a855f7] transition-colors"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch" className="text-gray-400 text-xs uppercase tracking-wider">Batch</Label>
                  <Input
                    id="batch"
                    placeholder="Summer 24"
                    className="bg-transparent border-0 border-b border-gray-700 rounded-none px-0 py-2 h-auto text-white placeholder:text-gray-600 focus-visible:ring-0 focus-visible:border-[#a855f7] transition-colors"
                    required
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                  />
                </div>
              </div>
            )}

            {error && <div className="text-sm text-red-500">{error}</div>}

            <Button type="submit" className="w-full h-12 bg-[#a855f7] hover:bg-[#9333ea] text-white font-medium rounded-lg shadow-lg shadow-purple-900/20" disabled={loading}>
              {loading ? "Processing..." : (mode === "login" ? "Login" : "Request Access")}
            </Button>
          </form>

          <div className="flex items-center justify-between pt-4">
            <span className="text-gray-500 text-sm">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            </span>
            <Button
              variant="outline"
              className="border-gray-700 bg-transparent text-white hover:bg-white/5 hover:text-white"
              onClick={() => {
                const newMode = mode === "login" ? "signup" : "login";
                setMode(newMode);
                navigate(newMode === "login" ? "/login" : "/signup");
              }}
            >
              {mode === "login" ? "Sign up" : "Login"}
            </Button>
          </div>
        </div>
      </div>

      {/* Right Side - Image Area */}
      <div className="hidden lg:flex w-1/2 bg-[#a855f7] items-center justify-center p-12 relative overflow-hidden">
        {/* Background blobs/circles for texture matching reference approximately */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-black/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 w-full max-w-lg text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Welcome to <br /> student portal
            </h2>
            <p className="text-white/80 text-lg">
              Login to access your account
            </p>
          </div>

          <div className="relative">
            <img
              src="/auth-illustration-flat.png"
              alt="Student Portal"
              className="w-full h-auto drop-shadow-2xl rounded-lg" // Added rounded-lg and maybe subtle shadow if needed, but reference is flat.
            // Reference image has transparent bg line art. My generated one has purple bg.
            // If generated image has purple bg, it might clash if shades diff. 
            // Ideally mix-blend-mode or just simple img if colors match well. 
            // Let's assume the generated image has #8A2BE2 which is close to #a855f7 (purple-500).
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;