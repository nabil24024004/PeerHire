import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase, CheckCircle2, Clock, DollarSign,
  Plus, MessageSquare, Eye, Star, ChevronRight
} from "lucide-react";
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
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
        return;
      }

      // Check localStorage for active role - redirect if user chose freelancer
      const activeRole = localStorage.getItem('activeRole');
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

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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

  const statsArray = [
    { icon: Briefcase, label: "Open Tasks", value: stats.openTasks.toString(), color: "text-primary" },
    { icon: CheckCircle2, label: "Completed", value: stats.completed.toString(), color: "text-success" },
    { icon: DollarSign, label: "Total Spent", value: `$${stats.totalSpent.toFixed(0)}`, color: "text-muted-foreground" },
    { icon: Star, label: "Avg. Rating", value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "N/A", color: "text-primary" },
  ];

  return (
    <DashboardLayout role="hirer">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back, {userName}!</h1>
            <p className="text-sm md:text-base text-muted-foreground">Manage your tasks and hire talented peers</p>
          </div>
          <Button size="lg" className="btn-glow w-full md:w-auto" onClick={() => setShowJobModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Post New Job
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {statsArray.map((stat, idx) => (
            <Card key={idx} className="p-4 md:p-6 card-hover">
              <div className="flex items-start justify-between mb-2 md:mb-4">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-xl md:text-3xl font-bold">{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* Your Tasks */}
        <div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-xl md:text-2xl font-bold">Your Tasks</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/hirer/tasks")}>
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          {recentJobs.length === 0 ? (
            <Card className="p-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-bold mb-2">No tasks yet</h3>
              <p className="text-muted-foreground mb-6">
                Click "Post New Job" to create your first task and connect with freelancers
              </p>
              <Button onClick={() => setShowJobModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Post Your First Job
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <Card key={job.id} className="p-4 md:p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 md:gap-4 mb-3">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base md:text-lg font-bold mb-1 truncate">{job.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                            <span>{job.category || "General"}</span>
                            <span className="hidden md:inline">•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 md:w-4 md:h-4" />
                              Due {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'No deadline'}
                            </span>
                            <span className="hidden md:inline">•</span>
                            <span className="text-primary font-semibold">${job.budget}</span>
                          </div>
                        </div>
                      </div>

                      <Badge
                        className={
                          job.status === "open"
                            ? "bg-primary/20 text-primary border-primary"
                            : job.status === "in_progress"
                              ? "bg-yellow-500/20 text-yellow-500 border-yellow-500"
                              : "bg-success/20 text-success border-success"
                        }
                      >
                        {job.status === "open" && `${job.applications_count} ${job.applications_count === 1 ? 'Offer' : 'Offers'}`}
                        {job.status === "in_progress" && "In Progress"}
                        {job.status === "completed" && "Completed"}
                      </Badge>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      {job.status === "in_progress" && (
                        <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => navigate("/messages")}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                      )}
                      <Button size="sm" className="w-full sm:w-auto" onClick={() => navigate(`/hirer/tasks`)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <Card className="p-6 md:p-8 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="text-center">
            <h3 className="text-xl md:text-2xl font-bold mb-3">Need help with another assignment?</h3>
            <p className="text-sm md:text-base text-muted-foreground mb-6">
              Post a new job and get matched with qualified freelancers in minutes
            </p>
            <Button size="lg" className="btn-glow w-full md:w-auto" onClick={() => setShowJobModal(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Create New Job
            </Button>
          </div>
        </Card>
      </div>

      <JobPostingModal open={showJobModal} onOpenChange={setShowJobModal} />
    </DashboardLayout>
  );
};

export default HirerDashboard;
