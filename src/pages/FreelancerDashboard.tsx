import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Briefcase, CheckCircle2, Star,
  Clock, MessageSquare, Eye, ChevronRight, Search, Calendar, ImageIcon
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
    earnings: 0,
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
        setUserName(profileData.full_name.split(' ')[0]);
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

      // Calculate total earnings
      const totalEarnings = completedJobs
        .reduce((sum, app) => sum + ((app.jobs as any).budget || 0), 0);

      setStats({
        activeJobs: activeJobs.length,
        completed: completedJobs.length,
        rating: rating || 0,
        earnings: totalEarnings,
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
        <div className="space-y-8 p-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
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

  return (
    <DashboardLayout role="freelancer">
      <div className="space-y-5 p-4 md:p-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-4 md:p-6">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-emerald-500 font-medium mb-1 flex items-center gap-1">
                <span className="text-emerald-500">✦</span> {getGreeting()}
              </p>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                Welcome back, <span className="text-emerald-500">{userName}</span>
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Here's what's happening with your projects today.
              </p>
            </div>

            {/* Status Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Status</span>
              <Switch
                checked={isAvailable}
                onCheckedChange={handleStatusToggle}
                className="data-[state=checked]:bg-emerald-500"
              />
              <Badge
                className={`px-3 py-1 text-xs font-semibold ${isAvailable
                  ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
                  : "bg-muted text-muted-foreground border-border"
                  }`}
              >
                {isAvailable ? "ONLINE" : "OFFLINE"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Earnings */}
          <Card className="p-3 md:p-5 bg-card border-border hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <TakaIcon className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">Earnings</p>
                <p className="text-lg md:text-2xl font-bold">৳{stats.earnings}</p>
              </div>
            </div>
          </Card>

          {/* Active Jobs */}
          <Card className="p-3 md:p-5 bg-card border-border hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">Active Jobs</p>
                <p className="text-lg md:text-2xl font-bold">{stats.activeJobs}</p>
              </div>
            </div>
          </Card>

          {/* Completed */}
          <Card className="p-3 md:p-5 bg-card border-border hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">Completed</p>
                <p className="text-lg md:text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </Card>

          {/* Rating */}
          <Card className="p-3 md:p-5 bg-card border-border hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">Rating</p>
                <p className="text-lg md:text-2xl font-bold">{stats.rating > 0 ? stats.rating.toFixed(1) : "New"}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Active Jobs Section */}
        <div>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <h2 className="text-lg md:text-xl font-bold">Active Jobs</h2>
              <Badge variant="outline" className="text-xs">
                {activeJobs.length}
              </Badge>
            </div>
            <Button
              variant="link"
              className="text-emerald-500 p-0 h-auto font-medium"
              onClick={() => navigate("/freelancer/browse-jobs")}
            >
              Find Work
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {activeJobs.length === 0 ? (
            <Card className="p-8 md:p-12 bg-card border-border text-center">
              {/* Empty State Icon */}
              <div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6">
                <div className="absolute inset-0 rounded-2xl bg-emerald-500/10 border border-emerald-500/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
                </div>
                {/* Green dot indicator */}
                <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 rounded-full bg-emerald-500 border-2 border-card" />
              </div>

              <h3 className="text-base md:text-lg font-bold mb-2">No active jobs right now</h3>
              <p className="text-muted-foreground text-xs md:text-sm mb-4 md:mb-6 max-w-sm mx-auto">
                Ready to start earning? Browse available projects and submit your proposals to hirers.
              </p>
              <Button
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 md:px-6 w-full sm:w-auto"
                onClick={() => navigate("/freelancer/browse-jobs")}
              >
                <Search className="w-4 h-4 mr-2" />
                Find Work
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeJobs.map((job) => (
                <Card
                  key={job.id}
                  className="p-3 md:p-4 bg-card border-border hover:border-emerald-500/30 transition-all group"
                >
                  <div className="flex flex-col gap-3 md:gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm md:text-base font-bold truncate group-hover:text-emerald-500 transition-colors">{job.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{job.subject || "General"}</span>
                          <span className="hidden sm:inline">{job.page_count} pages</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(job.deadline).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                          Hirer: {job.profiles?.full_name || "Unknown"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-xs">
                        In Progress
                      </Badge>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="border-border h-8 w-8 p-0" onClick={() => navigate("/messages")}>
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 h-8" onClick={() => navigate(`/freelancer/job/${job.id}`)}>
                          <Eye className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">View</span>
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
