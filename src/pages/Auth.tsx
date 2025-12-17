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
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Set mode based on route
  useEffect(() => {
    setError("");
    setStep("email");
    setOtp("");
    if (location.pathname === "/signup") {
      setMode("signup");
    } else if (location.pathname === "/login") {
      setMode("login");
    }
  }, [location]);

  // Countdown timer for resend
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const inputEmail = formData.get("email") as string;
    const fullName = formData.get("name") as string;
    const department = formData.get("department") as string;

    // Validate university email domain
    if (!inputEmail.endsWith("@aaub.edu.bd")) {
      setError("Please use your AAUB university email (@aaub.edu.bd)");
      setLoading(false);
      return;
    }

    try {
      // Store additional data for signup flow to be used after verification
      if (mode === "signup") {
        sessionStorage.setItem("signup_meta", JSON.stringify({ fullName, department }));
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: inputEmail,
        options: {
          shouldCreateUser: mode === "signup", // Only create user if in signup mode
          data: mode === "signup" ? { full_name: fullName } : undefined,
        },
      });

      if (error) {
        // If user tries to login but doesn't exist
        if (mode === "login" && error.message.includes("Signups not allowed for this instance")) {
          // This specific error might change depending on Supabase config, 
          // usually standard "signInWithOtp" allows signups unless disabled.
          // Better handling below.
        }
        throw error;
      }

      setEmail(inputEmail);
      setStep("otp");
      setTimeLeft(60); // 60 seconds cooldown
      toast({
        title: "Code sent!",
        description: "Please check your email for the verification code.",
      });

    } catch (error: any) {
      setError(error.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (error) throw error;

      if (data.user) {
        // Post-login/signup logic
        await handlePostAuth(data.user.id, data.user.email!);
      }

    } catch (error: any) {
      setError(error.message || "Invalid code");
      setLoading(false);
    }
  };

  const handlePostAuth = async (userId: string, userEmail: string) => {
    try {
      // Check/Create Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_hirer, is_freelancer')
        .eq('id', userId)
        .single();

      // Recover signup metadata if available
      const signupMetaStr = sessionStorage.getItem("signup_meta");
      const signupMeta = signupMetaStr ? JSON.parse(signupMetaStr) : null;

      // If no profile (new user), create one
      if (profileError || !profileData) {
        await supabase.from('profiles').upsert({
          id: userId,
          email: userEmail,
          full_name: signupMeta?.fullName || userEmail.split('@')[0],
          is_hirer: true,
          is_freelancer: true
        });

        // Clear temp storage
        sessionStorage.removeItem("signup_meta");
      }
      // Existing profile but missing roles (shouldn't happen often)
      else if (!profileData.is_hirer && !profileData.is_freelancer) {
        await supabase.from('profiles')
          .update({ is_hirer: true, is_freelancer: true })
          .eq('id', userId);
      }

      // Also update full_name if it was a signup usage
      if (mode === "signup" && signupMeta?.fullName) {
        await supabase
          .from('profiles')
          .update({ full_name: signupMeta.fullName })
          .eq('id', userId);
      }

      // Set default role
      localStorage.setItem('activeRole', 'hirer');

      toast({
        title: "Welcome!",
        description: "Redirecting to dashboard...",
      });

      navigate("/hirer/dashboard");
    } catch (error) {
      console.error("Post-auth error:", error);
      // Still redirect even if profile update failed slightly, as auth worked
      navigate("/hirer/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Mobile Header */}
      <div className="px-6 pt-8 pb-4 md:hidden">
        <button
          onClick={() => {
            if (step === "otp") setStep("email");
            else navigate("/");
          }}
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
                {step === "otp" ? "Check your email" : (mode === "login" ? "Welcome back" : "Join PeerHire")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {step === "otp"
                  ? `We sent a code to ${email}`
                  : (mode === "login" ? "Sign in with your university email" : "Create your account")}
              </p>
            </div>

            {step === "email" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="name" name="name" type="text" placeholder="John Doe" className="pl-10 h-11" required />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm">University Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="email" name="email" type="email" placeholder="you@aaub.edu.bd" className="pl-10 h-11" required defaultValue={email} />
                  </div>
                </div>

                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="department" className="text-sm">Department</Label>
                    <Input id="department" name="department" type="text" placeholder="CSE" className="h-11" required />
                  </div>
                )}

                {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>}

                <Button type="submit" className="w-full h-11 font-medium btn-glow" disabled={loading}>
                  {loading ? "Sending..." : "Send Login Code"}
                </Button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-3 text-muted-foreground">or</span></div>
                </div>

                <Button type="button" variant="outline" className="w-full h-11" onClick={handleGoogleSignIn} disabled={loading}>
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.013-1.133 8.053-3.24 2.08-2.08 2.747-5.12 2.747-8.24 0-.8-.067-1.547-.187-2.293h-10.613z" /></svg>
                  Continue with Google
                </Button>

                <p className="text-center text-sm text-muted-foreground pt-2">
                  {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                  <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); navigate(mode === "login" ? "/signup" : "/login"); }} className="text-primary font-medium hover:underline">
                    {mode === "login" ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="otp" className="text-sm">Verification Code</Label>
                  <Input id="otp" name="otp" type="text" placeholder="123456" className="h-11 text-center text-lg tracking-widest" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value)} />
                </div>

                {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>}

                <Button type="submit" className="w-full h-11 font-medium btn-glow" disabled={loading}>
                  {loading ? "Verifying..." : "Verify & Login"}
                </Button>

                <div className="text-center">
                  <button type="button" disabled={timeLeft > 0} onClick={(e) => { handleSendOtp(e); }} className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50">
                    {timeLeft > 0 ? `Resend code in ${timeLeft}s` : "Resend code"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Desktop Layout */}
          <Card className="hidden md:block overflow-hidden shadow-2xl">
            <div className="grid md:grid-cols-2">
              <div className="p-12">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold mb-2">
                    {step === "otp" ? "Check your email" : (mode === "login" ? "Welcome back" : "Join PeerHire")}
                  </h1>
                  <p className="text-muted-foreground">
                    {step === "otp"
                      ? `We've sent a 6-digit code to ${email}`
                      : (mode === "login" ? "Sign in with your university email" : "Create your account with OTP")}
                  </p>
                </div>

                {step === "email" ? (
                  <form onSubmit={handleSendOtp} className="space-y-6">
                    {mode === "signup" && (
                      <div className="space-y-2">
                        <Label htmlFor="name-desktop">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input id="name-desktop" name="name" type="text" placeholder="John Doe" className="pl-10 h-12" required />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email-desktop">University Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input id="email-desktop" name="email" type="email" placeholder="you@aaub.edu.bd" className="pl-10 h-12" required defaultValue={email} />
                      </div>
                    </div>

                    {mode === "signup" && (
                      <div className="space-y-2">
                        <Label htmlFor="department-desktop">Department</Label>
                        <Input id="department-desktop" name="department" type="text" placeholder="e.g., CSE" className="h-12" required />
                      </div>
                    )}

                    {error && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}

                    <Button type="submit" className="w-full h-12 text-lg btn-glow" disabled={loading}>
                      {loading ? "Sending..." : "Send Login Code"}
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
                    </div>

                    <Button type="button" variant="outline" className="w-full h-12" onClick={handleGoogleSignIn} disabled={loading}>
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.013-1.133 8.053-3.24 2.08-2.08 2.747-5.12 2.747-8.24 0-.8-.067-1.547-.187-2.293h-10.613z" /></svg>
                      Sign {mode === "login" ? "in" : "up"} with Google
                    </Button>

                    <div className="text-center">
                      <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); navigate(mode === "login" ? "/signup" : "/login"); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="otp-desktop">Verification Code</Label>
                      <Input id="otp-desktop" name="otp" type="text" placeholder="123456" className="h-12 text-center text-xl tracking-widest" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value)} />
                    </div>

                    {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>}

                    <Button type="submit" className="w-full h-12 text-lg btn-glow" disabled={loading}>
                      {loading ? "Verifying..." : "Verify & Login"}
                    </Button>

                    <div className="text-center">
                      <button type="button" disabled={timeLeft > 0} onClick={(e) => { handleSendOtp(e); }} className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50">
                        {timeLeft > 0 ? `Resend code in ${timeLeft}s` : "Resend code"}
                      </button>
                    </div>
                    <div className="text-center pt-2">
                      <button type="button" onClick={() => setStep("email")} className="text-sm text-primary hover:underline">
                        Wrong email? Change it
                      </button>
                    </div>
                  </form>
                )}

                <div className="mt-8 text-center">
                  <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    ← Back to home
                  </button>
                </div>
              </div>

              {/* Right Side - Info */}
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-12 flex flex-col justify-center border-l border-border">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-3">Password-less Entry</h2>
                    <p className="text-muted-foreground text-lg">Secure, fast, and easy. Just check your email.</p>
                  </div>
                  <div className="space-y-4 pt-6">
                    {["No more forgotten passwords", "Secure OTP verification", "One account, dual benefits", "Instant access"].map((point, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        </div>
                        <p className="text-foreground">{point}</p>
                      </div>
                    ))}
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