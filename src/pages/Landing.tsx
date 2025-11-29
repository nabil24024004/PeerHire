import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText, Beaker, FileCheck, Presentation, Edit3, Star, Clock, Shield, TrendingUp, Users, Zap, ChevronRight, ChevronDown, User, GraduationCap } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-collaboration.jpg";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const Landing = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<"hirer" | "freelancer">("hirer");
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [roleSelectionRole, setRoleSelectionRole] = useState<"hirer" | "freelancer">("hirer");
  const [roleLoading, setRoleLoading] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Get user role and redirect to appropriate dashboard
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (roleData) {
          navigate(roleData.role === 'freelancer' ? '/freelancer/dashboard' : '/hirer/dashboard');
        } else {
          // User authenticated but no role - show role selection dialog
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
    const department = formData.get("department") as string;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("No session found");

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: session.user.id,
          email: session.user.email!,
          full_name: fullName,
          department: department,
          active_role: roleSelectionRole,
        });

      if (profileError) throw profileError;

      // Create role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: session.user.id,
          role: roleSelectionRole,
        });

      if (roleError) throw roleError;

      // Create role-specific profile
      if (roleSelectionRole === 'freelancer') {
        const { error: freelancerError } = await supabase
          .from('freelancer_profiles')
          .insert({
            user_id: session.user.id,
            status: 'available',
            skills: [],
            hourly_rate: 0,
          });

        if (freelancerError) throw freelancerError;
      } else {
        const { error: hirerError } = await supabase
          .from('hirer_profiles')
          .insert({
            user_id: session.user.id,
            default_budget: 0,
            preferred_subjects: [],
          });

        if (hirerError) throw hirerError;
      }

      toast({
        title: "Profile created!",
        description: "Redirecting to your dashboard...",
      });

      // Redirect to appropriate dashboard
      navigate(roleSelectionRole === 'freelancer' ? '/freelancer/dashboard' : '/hirer/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create profile",
        variant: "destructive",
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
    name: "Borshon Chakraborty",
    dept: "Aerospace Engineering",
    text: "PeerHire made my group project documentation so much easier. Found an amazing writer!"
  }, {
    name: "Zayed Bin Siyam",
    dept: "AME",
    text: "Earning from my skills while studying. Perfect side hustle for students."
  }, {
    name: "Samin Yasir Mridul",
    dept: "AVE",
    text: "The handwriting samples feature is genius. Got exactly what I needed."
  }, {
    name: "Shahrier Ehsan",
    dept: "AVE",
    text: "Fast turnaround, great quality. This platform is a game-changer."
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
              Please select your role and complete your profile to continue.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRoleSelection} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label>Select Your Role</Label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setRoleSelectionRole("hirer")}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    roleSelectionRole === "hirer"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <GraduationCap className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-semibold">Hirer</p>
                  <p className="text-xs text-muted-foreground">Get work done</p>
                </button>
                <button
                  type="button"
                  onClick={() => setRoleSelectionRole("freelancer")}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    roleSelectionRole === "freelancer"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <User className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-semibold">Freelancer</p>
                  <p className="text-xs text-muted-foreground">Earn money</p>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="dialog-name">Full Name</Label>
              <Input
                id="dialog-name"
                name="name"
                type="text"
                placeholder="John Doe"
                required
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="dialog-department">Department</Label>
              <Input
                id="dialog-department"
                name="department"
                type="text"
                placeholder="e.g., CSE, EEE, AVE"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={roleLoading}>
              {roleLoading ? "Creating profile..." : "Continue"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden dot-pattern">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/10 to-background" />
        
        <div className="container mx-auto px-6 py-20 relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Role Toggle */}
            <div className="flex justify-center mb-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-card p-1.5 rounded-full border border-border">
                <button onClick={() => setSelectedRole("hirer")} className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${selectedRole === "hirer" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"}`}>
                  I'm a Hirer
                </button>
                <button onClick={() => setSelectedRole("freelancer")} className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${selectedRole === "freelancer" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"}`}>
                  I'm a Freelancer
                </button>
              </div>
            </div>

            {/* Hero Content */}
            <div className="text-center mb-12 space-y-6 animate-fade-in-up" style={{
            animationDelay: "0.1s"
          }}>
              <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
                Hire your peers for
                <span className="block gradient-text">varsity work.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                PeerHire connects students on the same campus for assignments, lab reports, and academic tasks with transparent pricing, live availability, and verified ratings.
              </p>

              {/* Trust Badges */}
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Badge variant="secondary" className="px-4 py-2 text-sm">
                  <Shield className="w-4 h-4 mr-2" />
                  Campus-Only
                </Badge>
                <Badge variant="secondary" className="px-4 py-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Verified Students
                </Badge>
                <Badge variant="secondary" className="px-4 py-2 text-sm">
                  <Zap className="w-4 h-4 mr-2" />
                  Instant Matching
                </Badge>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6 btn-glow" 
                  onClick={() => navigate("/signup", { state: { role: selectedRole } })}
                >
                  {selectedRole === "hirer" ? "Get Started as Hirer" : "Become a Freelancer"}
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2" onClick={() => navigate("/login")}>
                  Sign In
                </Button>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative mt-16 animate-fade-in-up" style={{
            animationDelay: "0.2s"
          }}>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border">
                <img src={heroImage} alt="Students collaborating" className="w-full h-auto" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </div>
              
              {/* Floating Cards */}
              <Card className="absolute -bottom-6 left-8 p-4 max-w-xs card-hover animate-float bg-card/95 backdrop-blur">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Assignment - 5 pages</p>
                    <p className="text-sm text-muted-foreground">Due in 2 days</p>
                  </div>
                </div>
              </Card>

              <Card className="absolute -top-6 right-8 p-4 card-hover bg-card/95 backdrop-blur" style={{
              animationDelay: "1s"
            }}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span className="font-semibold">Lab Report Completed</span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-primary text-primary" />)}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">How PeerHire Works</h2>
              <p className="text-xl text-muted-foreground">Simple, transparent, efficient</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {steps[selectedRole].map((step, idx) => <div key={idx} className="relative">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 border-2 border-primary flex items-center justify-center">
                      <span className="text-2xl font-bold gradient-text">{step.num}</span>
                    </div>
                    <h3 className="text-xl font-bold">{step.title}</h3>
                    <p className="text-muted-foreground">{step.desc}</p>
                  </div>
                  {idx < steps[selectedRole].length - 1 && <ChevronRight className="hidden md:block absolute top-8 -right-4 w-6 h-6 text-primary/50" />}
                </div>)}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">What We Offer</h2>
              <p className="text-xl text-muted-foreground">Campus expertise on demand</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {services.map((service, idx) => <Card key={idx} className="p-8 card-hover relative overflow-hidden group">
                  {service.tag && <Badge className="absolute top-4 right-4 bg-primary">{service.tag}</Badge>}
                  <service.icon className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                  <p className="text-muted-foreground">{service.desc}</p>
                </Card>)}
            </div>
          </div>
        </div>
      </section>

      {/* Live Preview Section */}
      <section className="py-24 bg-card/30 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Live Campus Talent</h2>
              <p className="text-xl text-muted-foreground">See who's available right now when you log in</p>
            </div>

            {/* Scrolling Freelancer Cards */}
            <div className="relative">
              <div className="flex gap-6 animate-slide-left">
                {[
                  { name: "Samin Yasir Mridul", department: "Computer Science" },
                  { name: "Sheikh Azwad Abrar", department: "Avionics Engineering" },
                  { name: "Shahrier Ehsan", department: "Electrical Engineering" },
                  { name: "Borshon Chakraborty", department: "Mechanical Engineering" },
                  { name: "Samin Yasir Mridul", department: "Computer Science" },
                  { name: "Sheikh Azwad Abrar", department: "Avionics Engineering" },
                  { name: "Shahrier Ehsan", department: "Electrical Engineering" },
                  { name: "Borshon Chakraborty", department: "Mechanical Engineering" },
                ].map((freelancer, idx) => <Card key={idx} className="flex-shrink-0 w-80 p-6 bg-card">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-bold mb-1">{freelancer.name}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{freelancer.department}</p>
                        <Badge className="bg-success/20 text-success border-success">
                          <div className="w-2 h-2 rounded-full bg-success mr-2" />
                          Available
                        </Badge>
                        <div className="flex items-center gap-1 mt-3">
                          {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 fill-primary text-primary" />)}
                          <span className="text-sm text-muted-foreground ml-2">{24 + idx} jobs</span>
                        </div>
                      </div>
                    </div>
                  </Card>)}
              </div>
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
                    <div className="w-12 h-12 rounded-full bg-primary/20" />
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

      {/* FAQ */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked</h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => <Card key={idx} className="overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full p-6 text-left flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <span className="font-bold text-lg">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${openFaq === idx ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === idx && <div className="px-6 pb-6 text-muted-foreground">
                      {faq.a}
                    </div>}
                </Card>)}
            </div>
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
              <a href="#" className="hover:text-foreground transition-colors">About</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            </div>
            
            <div className="mt-8 pt-8 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()}{" "}
                <a 
                  href="https://neuralab.lovable.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors font-medium"
                >
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
