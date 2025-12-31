import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase, CheckCircle2, Clock,
  Plus, MessageSquare, Eye, Star, ChevronRight
} from "lucide-react";
import { TakaIcon } from "@/components/icons/TakaIcon";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { JobPostingModal } from "@/components/JobPostingModal";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface JobWithApplications {
  id: string;
  title: string;
  category: string | null;
  deadline: string | null;
  budget: number;
  status: string;
  applications_count: number;
}

const HirerDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showJobModal, setShowJobModal] = useState(false);
  const [userName, setUserName] = useState("Student");
  const [stats, setStats] = useState({
    openTasks: 0,
    completed: 0,
    totalSpent: 0,
    avgRating: 0,
  });
  const [recentJobs, setRecentJobs] = useState<JobWithApplications[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const handleAuth = async (session: any) => {
      if (!isMounted) return;

      if (!session) {
        // Only redirect if not an OAuth callback (check for hash tokens)
        if (!window.location.hash.includes('access_token')) {
          navigate("/login");
        }
        return;
      }

      // Set default role if not set
      let activeRole = localStorage.getItem('activeRole');
      if (!activeRole) {
        localStorage.setItem('activeRole', 'hirer');
        activeRole = 'hirer';
      }

      // Redirect if user chose freelancer
      if (activeRole === 'freelancer') {
        navigate("/freelancer/dashboard");
        return;
      }

      // Get user's profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, is_hirer, is_freelancer')
        .eq('id', session.user.id)
        .single();

      if (profileData?.full_name) {
        setUserName(profileData.full_name);
      }

      // If user doesn't have hirer role at all, redirect to freelancer
      if (profileData && !profileData.is_hirer && profileData.is_freelancer) {
        localStorage.setItem('activeRole', 'freelancer');
        navigate("/freelancer/dashboard");
        return;
      }

      await fetchDashboardData(session.user.id);
      setIsLoading(false);
    };

    // Listen for auth state changes (handles OAuth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        handleAuth(session);
      } else if (event === 'SIGNED_OUT') {
        navigate("/login");
      }
    });

    // Also check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuth(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Real-time subscriptions for auto-refresh
  useEffect(() => {
    const setupRealtimeSubscriptions = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;

      // Subscribe to changes in jobs and applications
      const channel = supabase
        .channel('hirer-dashboard-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'jobs',
            filter: `hirer_id=eq.${userId}`,
          },
          () => {
            console.log('Jobs changed, refreshing dashboard...');
            fetchDashboardData(userId);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'applications',
          },
          (payload: any) => {
            // Reload on application changes
            console.log('Application changed:', payload);
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

  const fetchDashboardData = async (userId: string) => {
    try {
      // Fetch jobs first
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('hirer_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (jobsError) throw jobsError;

      // For each job, get application count separately
      const jobsWithCounts: JobWithApplications[] = await Promise.all(
        (jobs || []).map(async (job) => {
          const { count } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id);

          return {
            ...job,
            applications_count: count || 0
          };
        })
      );

      setRecentJobs(jobsWithCounts);

      // Calculate stats from all jobs (not just recent 5)
      const { data: allJobs } = await supabase
        .from('jobs')
        .select('status, budget')
        .eq('hirer_id', userId);

      const openCount = (allJobs || []).filter(j => j.status === 'open' || j.status === 'in_progress').length;
      const completedCount = (allJobs || []).filter(j => j.status === 'completed').length;
      const totalSpent = (allJobs || [])
        .filter(j => j.status === 'completed')
        .reduce((sum, j) => sum + (j.budget || 0), 0);

      // Fetch avg rating
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewer_id', userId);

      const avgRating = reviews && reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      setStats({
        openTasks: openCount,
        completed: completedCount,
        totalSpent,
        avgRating,
      });
    } catch (error: any) {
      toast({
        title: "Error loading dashboard",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="hirer">
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
    { icon: Briefcase, label: "Open Tasks", value: stats.openTasks.toString(), color: "from-purple-500 to-primary", featured: true },
    { icon: CheckCircle2, label: "Completed", value: stats.completed.toString(), color: "from-green-500 to-emerald-400" },
    { icon: TakaIcon, label: "Total Spent", value: `৳${stats.totalSpent.toFixed(0)}`, color: "from-blue-500 to-cyan-400" },
    { icon: Star, label: "Avg. Rating", value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "N/A", color: "from-yellow-500 to-orange-400" },
  ];

  return (
    <DashboardLayout role="hirer">
      <div className="space-y-6">
        {/* Header - Premium Style */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-br from-purple-900/30 to-card/80 backdrop-blur border border-white/10">
          <div>
            <p className="text-sm text-primary font-medium mb-1">{getGreeting()}</p>
            <h1 className="text-2xl md:text-3xl font-black">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-purple-400 via-primary to-violet-400 bg-clip-text text-transparent">
                {userName}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your tasks and hire talented peers</p>
          </div>
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-primary hover:from-purple-700 hover:to-primary/90 shadow-lg shadow-primary/25 border-0 font-bold"
            onClick={() => setShowJobModal(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Post New Job
          </Button>
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

        {/* Your Tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Your Tasks</h2>
            <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate("/hirer/tasks")}>
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {recentJobs.length === 0 ? (
            <Card className="p-10 text-center bg-card/60 backdrop-blur border-white/5">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">No tasks yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Post your first job and connect with talented peers
              </p>
              <Button
                className="bg-gradient-to-r from-purple-600 to-primary"
                onClick={() => setShowJobModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Post Your First Job
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <Card
                  key={job.id}
                  className="p-4 bg-card/60 backdrop-blur border-white/5 hover:border-primary/20 transition-all duration-300 group"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-primary/20 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate group-hover:text-primary transition-colors">{job.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>{job.category || "General"}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'No deadline'}
                          </span>
                          <span className="text-primary font-semibold">৳{job.budget}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge
                        className={
                          job.status === "open"
                            ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                            : job.status === "in_progress"
                              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              : "bg-green-500/20 text-green-400 border-green-500/30"
                        }
                      >
                        {job.status === "open" && `${job.applications_count} ${job.applications_count === 1 ? 'Offer' : 'Offers'}`}
                        {job.status === "in_progress" && "In Progress"}
                        {job.status === "completed" && "Completed"}
                      </Badge>

                      <div className="flex gap-2">
                        {job.status === "in_progress" && (
                          <Button variant="outline" size="sm" className="border-white/10" onClick={() => navigate("/messages")}>
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        )}
                        <Button size="sm" onClick={() => navigate(`/hirer/tasks`)}>
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

        {/* Quick Action CTA */}
        <Card className="p-6 bg-gradient-to-br from-purple-900/40 to-card/80 backdrop-blur border-white/10 text-center">
          <h3 className="text-xl font-bold mb-2">Need help with another assignment?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get matched with qualified freelancers in minutes
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-primary shadow-lg shadow-primary/25"
            onClick={() => setShowJobModal(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Job
          </Button>
        </Card>
      </div>

      <JobPostingModal open={showJobModal} onOpenChange={setShowJobModal} />
    </DashboardLayout>
  );
};

export default HirerDashboard;
