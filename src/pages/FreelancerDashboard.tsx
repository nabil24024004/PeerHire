import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Briefcase, CheckCircle2, Star,
  Clock, MessageSquare, Eye, ChevronRight
} from "lucide-react";
import { TakaIcon } from "@/components/icons/TakaIcon";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Job {
  id: string;
  title: string;
  subject: string | null;
  page_count: number;
  deadline: string;
  status: string;
  hirer_id: string;
  profiles: {
    full_name: string;
  };
}

const FreelancerDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("Freelancer");
  const [isAvailable, setIsAvailable] = useState(true);
  const [stats, setStats] = useState({
    activeJobs: 0,
    completed: 0,
    rating: 0,
    thisMonth: 0,
  });
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
        return;
      }

      // Check localStorage for active role - redirect if user chose hirer
      const activeRole = localStorage.getItem('activeRole');
      if (activeRole === 'hirer') {
        navigate("/hirer/dashboard");
        return;
      }

      // Get user's profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, is_hirer, is_freelancer, availability')
        .eq('id', session.user.id)
        .single();

      if (profileData?.full_name) {
        setUserName(profileData.full_name);
      }

      // If user doesn't have freelancer role at all, redirect to hirer
      if (profileData && !profileData.is_freelancer && profileData.is_hirer) {
        localStorage.setItem('activeRole', 'hirer');
        navigate("/hirer/dashboard");
        return;
      }

      // Set availability from profile
      if (profileData?.availability) {
        setIsAvailable(profileData.availability === 'available');
      }

      await fetchDashboardData(session.user.id, 0);
      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Real-time subscriptions for auto-refresh
  useEffect(() => {
    const setupRealtimeSubscriptions = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;

      // Subscribe to changes in jobs and applications
      const channel = supabase
        .channel('dashboard-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'applications',
            filter: `freelancer_id=eq.${userId}`,
          },
          () => {
            console.log('Applications changed, refreshing dashboard...');
            fetchDashboardData(userId);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'jobs',
          },
          (payload: any) => {
            // Reload if job status changed and affects this user
            console.log('Job updated:', payload);
            fetchDashboardData(userId);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSubscriptions();
  }, []);


  const fetchDashboardData = async (userId: string, rating?: number) => {
    try {
      // Fetch jobs where freelancer has accepted applications
      const { data: applications, error: appsError } = await supabase
        .from('applications')
        .select(`
          job_id,
          status,
          jobs (
            id,
            title,
            description,
            category,
            budget,
            deadline,
            status,
            hirer_id,
            profiles!jobs_hirer_id_fkey (full_name)
          )
        `)
        .eq('freelancer_id', userId)
        .eq('status', 'accepted');

      if (appsError) throw appsError;

      // Extract active jobs from accepted applications
      const activeJobs = (applications || [])
        .filter(app => app.jobs && ['in_progress', 'open'].includes((app.jobs as any).status))
        .map(app => ({
          ...(app.jobs as any),
          profiles: (app.jobs as any).profiles
        }));

      setActiveJobs(activeJobs);

      // Get completed jobs count via applications
      const { data: completedApps } = await supabase
        .from('applications')
        .select(`
          jobs!inner (status, budget, updated_at)
        `)
        .eq('freelancer_id', userId)
        .eq('status', 'accepted');

      const completedJobs = (completedApps || [])
        .filter(app => (app.jobs as any)?.status === 'completed');

      // Calculate monthly earnings
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const monthlyEarnings = completedJobs
        .filter(app => new Date((app.jobs as any).updated_at) >= firstDayOfMonth)
        .reduce((sum, app) => sum + ((app.jobs as any).budget || 0), 0);

      setStats({
        activeJobs: activeJobs.length,
        completed: completedJobs.length,
        rating: rating || 0,
        thisMonth: monthlyEarnings,
      });
    } catch (error: any) {
      toast({
        title: "Error loading dashboard",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleStatusToggle = async (checked: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('profiles')
        .update({ availability: checked ? 'available' : 'offline' })
        .eq('id', session.user.id);

      if (error) throw error;

      setIsAvailable(checked);
      toast({
        title: "Status updated",
        description: `You are now ${checked ? 'available' : 'offline'}`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="freelancer">
        <div className="space-y-8">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const statsArray = [
    { icon: TakaIcon, label: "This Month", value: `৳${stats.thisMonth.toFixed(0)}`, color: "from-green-500 to-emerald-400", featured: true },
    { icon: Briefcase, label: "Active Jobs", value: stats.activeJobs.toString(), color: "from-purple-500 to-primary" },
    { icon: CheckCircle2, label: "Completed", value: stats.completed.toString(), color: "from-blue-500 to-cyan-400" },
    { icon: Star, label: "Rating", value: stats.rating > 0 ? stats.rating.toFixed(1) : "New", color: "from-yellow-500 to-orange-400" },
  ];

  return (
    <DashboardLayout role="freelancer">
      <div className="space-y-6">
        {/* Header - Premium Style */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-green-900/30 to-card/80 backdrop-blur border border-white/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-green-400 font-medium mb-1">{getGreeting()}</p>
              <h1 className="text-2xl md:text-3xl font-black">
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  {userName}
                </span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Here's your freelance overview</p>
            </div>

            {/* Status Toggle - Premium */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-card/50 border border-white/10">
              <Label htmlFor="status" className="text-sm font-medium">Status</Label>
              <Switch id="status" checked={isAvailable} onCheckedChange={handleStatusToggle} />
              <Badge className={
                isAvailable
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
              }>
                <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-400 animate-pulse' : 'bg-zinc-400'} mr-2`} />
                {isAvailable ? "Available" : "Offline"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Bento Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsArray.map((stat, idx) => (
            <Card
              key={idx}
              className={`p-5 bg-card/60 backdrop-blur border-white/5 hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 ${stat.featured ? "md:col-span-2 lg:col-span-1" : ""
                }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-black">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Active Jobs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Active Jobs</h2>
            <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate("/freelancer/browse-jobs")}>
              Find Work
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {activeJobs.length === 0 ? (
            <Card className="p-10 text-center bg-card/60 backdrop-blur border-white/5">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">No active jobs</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Browse available jobs and submit proposals to start earning
              </p>
              <Button
                className="bg-gradient-to-r from-green-500 to-emerald-500"
                onClick={() => navigate("/freelancer/browse-jobs")}
              >
                Find Work
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeJobs.map((job) => (
                <Card
                  key={job.id}
                  className="p-4 bg-card/60 backdrop-blur border-white/5 hover:border-green-500/20 transition-all duration-300 group"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-6 h-6 text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate group-hover:text-green-400 transition-colors">{job.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>{job.subject || "General"}</span>
                          <span>{job.page_count} pages</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(job.deadline).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Hirer: {job.profiles?.full_name || "Unknown"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        In Progress
                      </Badge>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="border-white/10" onClick={() => navigate("/messages")}>
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button size="sm" className="bg-gradient-to-r from-green-500 to-emerald-500" onClick={() => navigate(`/freelancer/job/${job.id}`)}>
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FreelancerDashboard;
