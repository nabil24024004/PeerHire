import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText, Beaker, FileCheck, Presentation, Edit3, Star, Clock, Shield, TrendingUp, Users, Zap, ChevronRight, ChevronDown, User, GraduationCap } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import avatarAzwad from "@/assets/avatar-azwad.jpg";
import avatarShahrier from "@/assets/avatar-shahrier.png";
import avatarYearid from "@/assets/avatar-yearid.png";
import avatarSamin from "@/assets/avatar-samin.png";
import avatarMonabber from "@/assets/avatar-monabber.png";
import avatarMisbah from "@/assets/avatar-misbah.png";
import avatarSadmanKarim from "@/assets/avatar-sadman-karim.png";
import avatarSadmanSadaf from "@/assets/avatar-sadman-sadaf.png";
import avatarDibbendu from "@/assets/avatar-dibbendu.png";
import avatarRezwan from "@/assets/avatar-rezwan.jpg";
import avatarJim from "@/assets/avatar-jim.png";
import avatarMehedi from "@/assets/avatar-mehedi.jpg";
import neuraLabsLogo from "@/assets/neura-labs-logo.jpg";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
const Landing = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<"hirer" | "freelancer">("hirer");
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const {
    toast
  } = useToast();
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (session) {
        // Check if user has profile
        const {
          data: profileData
        } = await supabase.from('profiles').select('id, is_hirer, is_freelancer, full_name').eq('id', session.user.id).single();

        if (profileData) {
          // Check if user has at least one role
          if (profileData.is_hirer || profileData.is_freelancer) {
            // Has roles, redirect to dashboard
            const activeRole = localStorage.getItem('activeRole') || (profileData.is_hirer ? 'hirer' : 'freelancer');
            navigate(activeRole === 'freelancer' ? '/freelancer/dashboard' : '/hirer/dashboard');
          } else if (!profileData.full_name) {
            // Profile exists but missing full name and roles - show setup dialog
            setShowRoleDialog(true);
          } else {
            // Has name but no roles - update profile to give both roles and redirect
            await supabase.from('profiles').update({ is_hirer: true, is_freelancer: true }).eq('id', session.user.id);
            localStorage.setItem('activeRole', 'hirer');
            navigate('/hirer/dashboard');
          }
        } else {
          // No profile at all - show setup dialog
          setShowRoleDialog(true);
        }
      }
    };
    checkAuth();
  }, [navigate]);
  const handleRoleSelection = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleLoading(true);
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const fullName = formData.get("name") as string;
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("No session found");

      // Create profile with BOTH roles enabled (hirer and freelancer)
      const {
        error: profileError
      } = await supabase.from('profiles').insert({
        id: session.user.id,
        email: session.user.email!,
        full_name: fullName,
        is_hirer: true,
        is_freelancer: true
      });
      if (profileError) throw profileError;

      toast({
        title: "Profile created!",
        description: "You have both hirer and freelancer access. Redirecting..."
      });

      // Set default role to hirer and redirect
      localStorage.setItem('activeRole', 'hirer');
      navigate('/hirer/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create profile",
        variant: "destructive"
      });
    } finally {
      setRoleLoading(false);
    }
  };
  const services = [{
    icon: FileText,
    title: "Assignment Writing",
    desc: "Essays, research papers, reports",
    tag: "Popular"
  }, {
    icon: Beaker,
    title: "Lab Reports",
    desc: "Data analysis & documentation",
    tag: "Fast"
  }, {
    icon: FileCheck,
    title: "Project Documentation",
    desc: "Technical & academic projects"
  }, {
    icon: Presentation,
    title: "Presentations",
    desc: "Slides, visual design, content"
  }, {
    icon: Edit3,
    title: "Proofreading",
    desc: "Grammar, structure, citations"
  }];
  const steps = {
    hirer: [{
      num: "01",
      title: "Post a Task",
      desc: "Define your assignment needs & deadline"
    }, {
      num: "02",
      title: "Get Matched",
      desc: "Top-rated peers send offers"
    }, {
      num: "03",
      title: "Track Progress",
      desc: "Stay updated with live status"
    }, {
      num: "04",
      title: "Receive & Rate",
      desc: "Get quality work, rate the freelancer"
    }],
    freelancer: [{
      num: "01",
      title: "Create Profile",
      desc: "Showcase skills & handwriting samples"
    }, {
      num: "02",
      title: "Browse Jobs",
      desc: "Find tasks matching your expertise"
    }, {
      num: "03",
      title: "Deliver Work",
      desc: "Complete assignments on time"
    }, {
      num: "04",
      title: "Get Paid",
      desc: "Earn money & build reputation"
    }]
  };
  const testimonials = [{
    name: "Yearid Hasan Jim",
    dept: "Aerospace Engineering",
    text: "PeerHire made my group project documentation so much easier. Found an amazing writer!",
    avatar: avatarYearid
  }, {
    name: "Monabber Hossain Miraz",
    dept: "AME",
    text: "Earning from my skills while studying. Perfect side hustle for students.",
    avatar: avatarMonabber
  }, {
    name: "Samin Yasir Mridul",
    dept: "AVE",
    text: "The handwriting samples feature is genius. Got exactly what I needed.",
    avatar: avatarSamin
  }, {
    name: "Shahrier Ehsan",
    dept: "AVE",
    text: "Fast turnaround, great quality. This platform is a game-changer.",
    avatar: avatarShahrier
  }];
  const faqs = [{
    q: "Is PeerHire allowed for academic work?",
    a: "PeerHire facilitates peer collaboration for reference and learning support. Users are responsible for following their institution's academic integrity policies."
  }, {
    q: "How does payment work?",
    a: "Hirers pay when they post a job. Funds are held securely and released to freelancers upon successful delivery and approval."
  }, {
    q: "How are freelancers rated?",
    a: "After each completed job, hirers rate freelancers on quality, timeliness, and communication. Ratings are visible on profiles."
  }, {
    q: "Can I choose handwriting style?",
    a: "Yes! Freelancers upload handwriting samples. You can view samples and request specific styles when posting a job."
  }];
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  return <div className="min-h-screen bg-background">
    {/* Role Selection Dialog for OAuth Users */}
    <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            You'll have access to both hirer and freelancer features. Complete your profile to continue.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleRoleSelection} className="space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="dialog-name">Full Name</Label>
            <Input id="dialog-name" name="name" type="text" placeholder="John Doe" required />
          </div>

          <Button type="submit" className="w-full" disabled={roleLoading}>
            {roleLoading ? "Creating profile..." : "Continue"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>

    {/* Hero Section */}
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-background">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-900/10 rounded-full blur-[150px]" />
      </div>

      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
      }} />

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Role Toggle */}
          <div className="flex justify-center mb-8 animate-fade-in-up">
            <div className="relative inline-flex items-center gap-1 bg-card/50 backdrop-blur-xl p-1 rounded-full border border-white/10 shadow-2xl">
              <button
                onClick={() => setSelectedRole("hirer")}
                className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-500 ${selectedRole === "hirer"
                  ? "text-white"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {selectedRole === "hirer" && (
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-primary rounded-full shadow-lg shadow-primary/25" />
                )}
                <span className="relative flex items-center gap-2">
                  <User className="w-4 h-4" />
                  I need work done
                </span>
              </button>
              <button
                onClick={() => setSelectedRole("freelancer")}
                className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-500 ${selectedRole === "freelancer"
                  ? "text-white"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {selectedRole === "freelancer" && (
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-primary rounded-full shadow-lg shadow-primary/25" />
                )}
                <span className="relative flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  I want to earn
                </span>
              </button>
            </div>
          </div>

          {/* Hero Content Grid */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Text Content */}
            <div className="text-center lg:text-left space-y-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                <Zap className="w-4 h-4" />
                <span>AAUB Students Only</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1]">
                <span className="text-foreground">Get your</span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-primary to-violet-400 bg-clip-text text-transparent">
                  varsity work
                </span>
                <br />
                <span className="text-foreground">done.</span>
              </h1>

              {/* Description */}
              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {selectedRole === "hirer"
                  ? "Post assignments, lab reports, or presentations. Get matched with skilled peers who deliver quality work on time."
                  : "Pick up academic tasks from fellow students. Set your rates, build your reputation, and earn while you learn."
                }
              </p>

              {/* Stats Row */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 pt-2">
                <div className="text-center lg:text-left">
                  <p className="text-3xl font-black text-foreground">500+</p>
                  <p className="text-sm text-muted-foreground">Jobs completed</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-3xl font-black text-foreground">4.9</p>
                  <p className="text-sm text-muted-foreground">Avg. rating</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-3xl font-black text-foreground">24h</p>
                  <p className="text-sm text-muted-foreground">Avg. delivery</p>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                <Button
                  size="lg"
                  className="text-lg px-10 py-7 bg-gradient-to-r from-purple-600 to-primary hover:from-purple-700 hover:to-primary/90 shadow-xl shadow-primary/25 border-0"
                  onClick={() => navigate("/signup", { state: { role: selectedRole } })}
                >
                  {selectedRole === "hirer" ? "Post a Task" : "Start Earning"}
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-10 py-7 border-2 border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10"
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </Button>
              </div>
            </div>

            {/* Right: Bento Grid Showcase */}
            <div className="relative animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <div className="grid grid-cols-2 gap-4">
                {/* Main Feature Card */}
                <Card className="col-span-2 p-6 bg-gradient-to-br from-purple-900/40 to-card/80 backdrop-blur-xl border-white/10 hover:border-primary/30 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/25">
                      <CheckCircle2 className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg mb-1">Lab Report Completed</p>
                      <p className="text-sm text-muted-foreground mb-3">Physics - Thermodynamics</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                        <span className="text-sm text-muted-foreground ml-2">5.0</span>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Delivered</Badge>
                  </div>
                </Card>

                {/* Task Card */}
                <Card className="p-5 bg-card/60 backdrop-blur-xl border-white/10 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex flex-col h-full">
                    <div className="w-11 h-11 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="font-bold mb-1">Assignment</p>
                    <p className="text-sm text-muted-foreground mb-3">5 pages • Due in 2 days</p>
                    <div className="mt-auto">
                      <p className="text-2xl font-black text-primary">৳250</p>
                    </div>
                  </div>
                </Card>

                {/* Availability Card */}
                <Card className="p-5 bg-card/60 backdrop-blur-xl border-white/10 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex flex-col h-full">
                    <div className="w-11 h-11 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
                      <Users className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="font-bold mb-1">Peers Online</p>
                    <p className="text-sm text-muted-foreground mb-3">Ready to help</p>
                    <div className="mt-auto flex -space-x-2">
                      {[avatarYearid, avatarMisbah, avatarSamin].map((avatar, i) => (
                        <img
                          key={i}
                          src={avatar}
                          alt="Peer"
                          className="w-8 h-8 rounded-full border-2 border-background"
                        />
                      ))}
                      <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-bold text-primary">
                        +12
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Live Status Card */}
                <Card className="col-span-2 p-5 bg-card/60 backdrop-blur-xl border-white/10 hover:border-primary/30 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                        <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75" />
                      </div>
                      <div>
                        <p className="font-bold">Live Matching</p>
                        <p className="text-sm text-muted-foreground">Average response: 15 min</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-semibold">12 active jobs</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-br from-purple-500/30 to-transparent rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* How It Works */}
    <section className="py-16 md:py-24 bg-card/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">How PeerHire Works</h2>
            <p className="text-base md:text-xl text-muted-foreground">Simple, transparent, efficient</p>
          </div>

          {/* Desktop: Timeline Layout */}
          <div className="hidden md:block relative">
            {/* Timeline Line */}
            <div className="absolute top-8 left-0 right-0 h-[2px] bg-border" />

            <div className="grid grid-cols-4 gap-4">
              {steps[selectedRole].map((step, idx) => (
                <div key={idx} className="relative flex flex-col items-center">
                  {/* Step Number Box */}
                  <div className="relative z-10 w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mb-6 shadow-lg">
                    <span className="text-xl font-semibold text-foreground">{step.num}</span>
                  </div>
                  {/* Title & Description */}
                  <h3 className="text-lg font-semibold text-center mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-[180px]">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: Vertical Timeline */}
          <div className="md:hidden relative pl-8">
            {/* Vertical Line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-border" />

            <div className="space-y-8">
              {steps[selectedRole].map((step, idx) => (
                <div key={idx} className="relative flex items-start gap-4">
                  {/* Step Number Box */}
                  <div className="relative z-10 w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center flex-shrink-0 shadow-md -ml-8">
                    <span className="text-sm font-semibold text-foreground">{step.num}</span>
                  </div>
                  {/* Title & Description */}
                  <div className="pt-1.5">
                    <h3 className="text-base font-semibold mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Services - Premium Bento Grid */}
    <section className="py-20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Our Services
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              What We{" "}
              <span className="bg-gradient-to-r from-purple-400 via-primary to-violet-400 bg-clip-text text-transparent">
                Offer
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Campus expertise on demand — quality work by verified peers
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Featured: Assignment Writing */}
            <Card className="md:col-span-2 p-6 md:p-8 bg-gradient-to-br from-purple-900/30 to-card/80 backdrop-blur-xl border-white/10 hover:border-primary/30 transition-all duration-500 group relative overflow-hidden">
              <Badge className="absolute top-4 right-4 bg-primary/90 text-white border-0">Popular</Badge>
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black mb-2">Assignment Writing</h3>
                  <p className="text-muted-foreground mb-4">
                    Essays, research papers, reports, and academic writing. Get professionally crafted content with proper citations.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">Essays</Badge>
                    <Badge variant="secondary" className="text-xs">Research Papers</Badge>
                    <Badge variant="secondary" className="text-xs">Reports</Badge>
                  </div>
                </div>
              </div>
            </Card>

            {/* Lab Reports */}
            <Card className="p-6 bg-card/60 backdrop-blur-xl border-white/10 hover:border-primary/30 transition-all duration-300 group hover:-translate-y-1">
              <Badge className="absolute top-4 right-4 bg-green-500/20 text-green-400 border-green-500/30">Fast</Badge>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Beaker className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Lab Reports</h3>
              <p className="text-sm text-muted-foreground">
                Data analysis & documentation with precise methodology
              </p>
            </Card>

            {/* Project Documentation */}
            <Card className="p-6 bg-card/60 backdrop-blur-xl border-white/10 hover:border-primary/30 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <FileCheck className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Project Documentation</h3>
              <p className="text-sm text-muted-foreground">
                Technical & academic project write-ups
              </p>
            </Card>

            {/* Presentations */}
            <Card className="p-6 bg-card/60 backdrop-blur-xl border-white/10 hover:border-primary/30 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Presentation className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Presentations</h3>
              <p className="text-sm text-muted-foreground">
                Slides, visual design, content
              </p>
            </Card>

            {/* Proofreading */}
            <Card className="p-6 bg-card/60 backdrop-blur-xl border-white/10 hover:border-primary/30 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Edit3 className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Proofreading</h3>
              <p className="text-sm text-muted-foreground">
                Grammar, structure, citations
              </p>
            </Card>
          </div>
        </div>
      </div>
    </section>

    {/* Live Campus Talent - Authentic Showcase */}
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-card/50 via-transparent to-card/50" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Meet Your{" "}
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Campus Peers
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Real students, real skills, ready to help with your work
            </p>
          </div>

          {/* Scrolling Carousel - More organic cards */}
          <div className="relative overflow-hidden group/carousel space-y-5">
            {/* First row */}
            <div className="flex gap-5 animate-infinite-scroll group-hover/carousel:[animation-play-state:paused]">
              {[
                {
                  name: "Samin Mridul",
                  dept: "AVE '24",
                  avatar: avatarSamin,
                  skill: "Assignment Writing",
                  specialty: "Lab Reports",
                  rating: 4.9,
                  reviews: 31,
                  status: "online"
                },
                {
                  name: "Azwad Abrar",
                  dept: "AVE '23",
                  avatar: avatarAzwad,
                  skill: "UI/UX, Research",
                  specialty: "Assignments",
                  rating: 5.0,
                  reviews: 47,
                  status: "online"
                },
                {
                  name: "Shahrier Ehsan",
                  dept: "AVE '23",
                  avatar: avatarShahrier,
                  skill: "Circuit Design, Docs",
                  specialty: "Project Work",
                  rating: 4.8,
                  reviews: 28,
                  status: "busy"
                },
                {
                  name: "Yearid Jim",
                  dept: "AVE '23",
                  avatar: avatarYearid,
                  skill: "AutoCAD, Technical",
                  specialty: "Documentation",
                  rating: 4.7,
                  reviews: 19,
                  status: "online"
                }
              ].concat([
                {
                  name: "Samin Mridul",
                  dept: "AVE '24",
                  avatar: avatarSamin,
                  skill: "Python, Web Dev",
                  specialty: "Lab Reports",
                  rating: 4.9,
                  reviews: 31,
                  status: "online"
                },
                {
                  name: "Azwad Abrar",
                  dept: "AVE '23",
                  avatar: avatarAzwad,
                  skill: "UI/UX, Research",
                  specialty: "Assignments",
                  rating: 5.0,
                  reviews: 47,
                  status: "online"
                },
                {
                  name: "Shahrier Ehsan",
                  dept: "AVE '23",
                  avatar: avatarShahrier,
                  skill: "Circuit Design, Docs",
                  specialty: "Project Work",
                  rating: 4.8,
                  reviews: 28,
                  status: "busy"
                },
                {
                  name: "Yearid Jim",
                  dept: "AVEE '23",
                  avatar: avatarYearid,
                  skill: "AutoCAD, Technical",
                  specialty: "Documentation",
                  rating: 4.7,
                  reviews: 19,
                  status: "online"
                }
              ]).map((person, idx) => (
                <Card key={`row1-${idx}`} className="flex-shrink-0 w-72 p-5 bg-card/80 backdrop-blur border-white/5 hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 group">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <img src={person.avatar} alt={person.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-white/10" />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card ${person.status === "online" ? "bg-green-500" : "bg-yellow-500"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{person.name}</h4>
                      <p className="text-xs text-muted-foreground">{person.dept}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-semibold">{person.rating}</span>
                        <span className="text-xs text-muted-foreground">({person.reviews})</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-xs text-muted-foreground mb-2">{person.skill}</p>
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">{person.specialty}</Badge>
                  </div>
                </Card>
              ))}
            </div>

            {/* Second row - reverse direction */}
            <div className="flex gap-5 animate-infinite-scroll-reverse group-hover/carousel:[animation-play-state:paused]">
              {[
                {
                  name: "Misbah Haque",
                  dept: "BBA '24",
                  avatar: avatarMisbah,
                  skill: "Business Writing",
                  specialty: "Case Studies",
                  rating: 4.9,
                  reviews: 23,
                  status: "online"
                },
                {
                  name: "Sadman Karim",
                  dept: "CE '25",
                  avatar: avatarSadmanKarim,
                  skill: "Structural, Math",
                  specialty: "Calculations",
                  rating: 4.6,
                  reviews: 15,
                  status: "online"
                },
                {
                  name: "Sadman Sadaf",
                  dept: "ARCH '24",
                  avatar: avatarSadmanSadaf,
                  skill: "Design, Visuals",
                  specialty: "Presentations",
                  rating: 5.0,
                  reviews: 34,
                  status: "busy"
                },
                {
                  name: "Dibbendu Barua",
                  dept: "ECE '25",
                  avatar: avatarDibbendu,
                  skill: "Electronics, PCB",
                  specialty: "Lab Reports",
                  rating: 4.8,
                  reviews: 21,
                  status: "online"
                }
              ].concat([
                {
                  name: "Misbah Haque",
                  dept: "BBA '24",
                  avatar: avatarMisbah,
                  skill: "Business Writing",
                  specialty: "Case Studies",
                  rating: 4.9,
                  reviews: 23,
                  status: "online"
                },
                {
                  name: "Sadman Karim",
                  dept: "CE '25",
                  avatar: avatarSadmanKarim,
                  skill: "Structural, Math",
                  specialty: "Calculations",
                  rating: 4.6,
                  reviews: 15,
                  status: "online"
                },
                {
                  name: "Sadman Sadaf",
                  dept: "ARCH '24",
                  avatar: avatarSadmanSadaf,
                  skill: "Design, Visuals",
                  specialty: "Presentations",
                  rating: 5.0,
                  reviews: 34,
                  status: "busy"
                },
                {
                  name: "Dibbendu Barua",
                  dept: "ECE '25",
                  avatar: avatarDibbendu,
                  skill: "Electronics, PCB",
                  specialty: "Lab Reports",
                  rating: 4.8,
                  reviews: 21,
                  status: "online"
                }
              ]).map((person, idx) => (
                <Card key={`row2-${idx}`} className="flex-shrink-0 w-72 p-5 bg-card/80 backdrop-blur border-white/5 hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 group">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <img src={person.avatar} alt={person.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-white/10" />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card ${person.status === "online" ? "bg-green-500" : "bg-yellow-500"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{person.name}</h4>
                      <p className="text-xs text-muted-foreground">{person.dept}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-semibold">{person.rating}</span>
                        <span className="text-xs text-muted-foreground">({person.reviews})</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-xs text-muted-foreground mb-2">{person.skill}</p>
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">{person.specialty}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-10">
            <Button variant="outline" size="lg" className="border-white/10" onClick={() => navigate("/signup")}>
              Join & Browse All Peers
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>

    {/* Testimonials */}
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Trusted by Students</h2>
            <p className="text-xl text-muted-foreground">Across campus</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, idx) => <Card key={idx} className="p-8 card-hover">
              <div className="flex items-center gap-4 mb-4">
                <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <p className="font-bold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.dept} Student</p>
                </div>
              </div>
              <p className="text-muted-foreground italic">"{testimonial.text}"</p>
            </Card>)}
          </div>
        </div>
      </div>
    </section>

    {/* FAQ - Modern Design */}
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/3 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Got Questions?
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Frequently{" "}
              <span className="bg-gradient-to-r from-purple-400 via-primary to-violet-400 bg-clip-text text-transparent">
                Asked
              </span>
            </h2>
          </div>

          {/* FAQ Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {faqs.map((faq, idx) => (
              <Card
                key={idx}
                className="p-0 bg-card/60 backdrop-blur border-white/5 hover:border-primary/20 transition-all duration-300 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-start gap-4 hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary font-bold text-sm">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-sm leading-snug">{faq.q}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 mt-1 ${openFaq === idx ? "rotate-180" : ""}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pl-[4.25rem] text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="text-center mt-10">
            <p className="text-muted-foreground mb-4">Still have questions?</p>
            <Button variant="outline" size="sm" className="border-white/10" onClick={() => window.open('https://neuralabsagency.vercel.app/#connect', '_blank')}>
              Contact Support
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </section>

    {/* About Us / Built By Section */}
    <section className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              About the Creators
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Built by{" "}
              <span className="bg-gradient-to-r from-purple-400 via-primary to-violet-400 bg-clip-text text-transparent">
                Neura Labs
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A student-led software agency crafting intelligent solutions for real-world problems
            </p>
          </div>

          {/* Agency Card */}
          <Card className="p-8 md:p-12 bg-gradient-to-br from-card/80 to-purple-900/20 backdrop-blur-xl border-white/10 hover:border-primary/30 transition-all duration-500">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Left: Agency Info */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <img
                    src={neuraLabsLogo}
                    alt="Neura Labs"
                    className="w-16 h-16 rounded-2xl object-cover shadow-lg"
                  />
                  <div>
                    <h3 className="text-2xl font-black">Neura Labs</h3>
                    <p className="text-muted-foreground">Software Agency</p>
                  </div>
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  We're a team of passionate AAUB students building innovative software solutions.
                  PeerHire is our flagship product designed to help fellow students collaborate
                  on academic work efficiently and transparently.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Badge variant="secondary" className="px-3 py-1.5">
                    <Zap className="w-3 h-3 mr-1" />
                    Web Development
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1.5">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    AI Solutions
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1.5">
                    <Shield className="w-3 h-3 mr-1" />
                    Product Design
                  </Badge>
                </div>

                <a
                  href="https://neuralabsagency.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  Visit Neura Labs
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>

              {/* Right: Stats & Mini Team */}
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-background/50 border border-white/10 text-center">
                    <p className="text-3xl font-black text-primary">10+</p>
                    <p className="text-sm text-muted-foreground">Projects Built</p>
                  </div>
                  <div className="p-4 rounded-xl bg-background/50 border border-white/10 text-center">
                    <p className="text-3xl font-black text-primary">200+</p>
                    <p className="text-sm text-muted-foreground">Users Served</p>
                  </div>
                  <div className="p-4 rounded-xl bg-background/50 border border-white/10 text-center">
                    <p className="text-3xl font-black text-primary">4.9★</p>
                    <p className="text-sm text-muted-foreground">User Rating</p>
                  </div>
                  <div className="p-4 rounded-xl bg-background/50 border border-white/10 text-center">
                    <p className="text-3xl font-black text-primary">24/7</p>
                    <p className="text-sm text-muted-foreground">Support</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>

    {/* Final CTA */}
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 dot-pattern" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Join hundreds of students already using PeerHire
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6 btn-glow" onClick={() => navigate("/signup")}>
              Sign Up as Hirer
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2" onClick={() => navigate("/signup")}>
              Sign Up as Freelancer
            </Button>
          </div>
        </div>
      </div>
    </section>

    {/* Footer */}
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">PeerHire</h3>
          <p className="text-muted-foreground mb-6">A campus-only marketplace for students

          </p>
          <div className="gap-8 text-sm text-muted-foreground flex items-center justify-center">
            <a className="hover:text-foreground transition-colors" href="https://neuralabsagency.vercel.app/#about">About</a>
            <a className="hover:text-foreground transition-colors" href="https://neuralabsagency.vercel.app/#connect">Contact</a>
            <a className="hover:text-foreground transition-colors" href="https://neuralabsagency.vercel.app/privacy">Terms</a>
            <a className="hover:text-foreground transition-colors" href="https://neuralabsagency.vercel.app/privacy">Privacy</a>
          </div>

          <div className="mt-8 pt-8 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()}{" "}
              <a target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors font-medium" href="https://neuralabsagency.vercel.app/">
                Neura Labs
              </a>
              {" "}all rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  </div>;
};
export default Landing;
