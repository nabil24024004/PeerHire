import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { JobPostingModal } from "@/components/JobPostingModal";
import {
  Plus,
  Briefcase,
  CheckCircle2,
  DollarSign,
  Star,
  Eye,
  ChevronRight,
  Clock
} from "lucide-react";

interface JobWithApplications {
  id: string;
  title: string;
  category: string | null;
  deadline: string | null;
  budget: number;
  status: string;
  applications_count: number;
}

interface DashboardStats {
  openTasks: number;
  completedTasks: number;
  totalSpent: number;
  avgRating: number;
}

export default function HirerDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    openTasks: 0,
    completedTasks: 0,
    totalSpent: 0,
    avgRating: 0,
  });
  const [recentJobs, setRecentJobs] = useState<JobWithApplications[]>([]);
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || role !== "hirer")) {
      navigate("/");
    }
  }, [user, role, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (data?.full_name) {
      setUserName(data.full_name.split(" ")[0]);
    }
  };

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .eq("hirer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (jobsError) throw jobsError;

      // Fetch application counts for each job
      const jobsWithCounts = await Promise.all(
        (jobsData || []).map(async (job) => {
          const { count } = await supabase
            .from("applications")
            .select("*", { count: "exact", head: true })
            .eq("job_id", job.id);

          return {
            ...job,
            applications_count: count || 0,
          };
        })
      );

      setRecentJobs(jobsWithCounts);

      // Calculate stats
      const openTasks = jobsData?.filter(j => j.status === "open").length || 0;
      const completedTasks = jobsData?.filter(j => j.status === "completed").length || 0;

      // Get total spent from payments (using 'as any' because payments table may not be in generated types)
      const { data: paymentsData } = await (supabase as any)
        .from("payments")
        .select("amount")
        .eq("user_id", user.id)
        .eq("status", "paid");

      const totalSpent = (paymentsData || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);

      // Get avg rating
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("rating")
        .eq("reviewer_id", user.id);

      const avgRating = reviewsData?.length
        ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length
        : 0;

      setStats({
        openTasks,
        completedTasks,
        totalSpent,
        avgRating,
      });

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No deadline";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (job: JobWithApplications) => {
    if (job.status === "completed") {
      return (
        <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 dark:bg-green-900/20 dark:text-green-400 text-xs font-medium border border-green-500/20 dark:border-green-900/30">
          Completed
        </span>
      );
    }

    if (job.applications_count > 0) {
      return (
        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
          {job.applications_count} Offer{job.applications_count !== 1 ? 's' : ''}
        </span>
      );
    }

    return (
      <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-medium border border-gray-200 dark:border-gray-700">
        0 Offers
      </span>
    );
  };

  const getCategoryIcon = (category: string | null) => {
    // Default icon
    return <Briefcase className="w-5 h-5" />;
  };

  if (loading || authLoading) {
    return (
      <DashboardLayout role="hirer">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="hirer">
      <div className="p-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-card to-card relative overflow-hidden rounded-2xl p-8 border border-border shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

          <div className="relative z-10 flex justify-between items-center">
            <div>
              <p className="text-primary text-sm font-medium mb-1">{getGreeting()}</p>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, <span className="text-secondary">{userName || "there"}</span>
              </h1>
              <p className="text-muted-foreground">Manage your tasks and hire talented peers</p>
            </div>

            <button
              onClick={() => setIsPostJobModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2 font-medium hover:shadow-primary/30"
            >
              <Plus className="w-5 h-5" />
              Post New Job
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Open Tasks */}
          <div className="bg-card p-5 rounded-2xl border border-border flex items-center gap-4 hover:border-primary/50 transition-colors cursor-default">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Open Tasks</p>
              <p className="text-2xl font-bold">{stats.openTasks}</p>
            </div>
          </div>

          {/* Completed */}
          <div className="bg-card p-5 rounded-2xl border border-border flex items-center gap-4 hover:border-green-500/50 transition-colors cursor-default">
            <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center text-green-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Completed</p>
              <p className="text-2xl font-bold">{stats.completedTasks}</p>
            </div>
          </div>

          {/* Total Spent */}
          <div className="bg-card p-5 rounded-2xl border border-border flex items-center gap-4 hover:border-blue-500/50 transition-colors cursor-default">
            <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Spent</p>
              <p className="text-2xl font-bold">৳{stats.totalSpent.toFixed(0)}</p>
            </div>
          </div>

          {/* Avg Rating */}
          <div className="bg-card p-5 rounded-2xl border border-border flex items-center gap-4 hover:border-orange-500/50 transition-colors cursor-default">
            <div className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Avg. Rating</p>
              <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
            </div>
          </div>
        </div>

        {/* Your Tasks */}
        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold">Your Tasks</h2>
            <button
              onClick={() => navigate("/hirer/tasks")}
              className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {recentJobs.length === 0 ? (
              <div className="bg-card rounded-2xl p-10 border border-border text-center">
                <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No tasks yet. Create your first job posting!</p>
              </div>
            ) : (
              recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-card rounded-2xl p-5 border border-border flex items-center justify-between hover:bg-accent transition-colors group"
                >
                  <div className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                      {getCategoryIcon(job.category)}
                    </div>

                    <div>
                      <h3 className="text-base font-bold mb-1">{job.title}</h3>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{job.category || "General"}</span>
                        <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(job.deadline)}
                        </span>
                        <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                        <span className="text-primary font-semibold">৳{job.budget}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {getStatusBadge(job)}

                    <button
                      onClick={() => navigate(`/hirer/task/${job.id}/offers`)}
                      className="bg-primary/10 hover:bg-primary text-primary hover:text-white px-5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 group-hover:shadow-lg group-hover:shadow-primary/20"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-10 text-center border border-gray-800 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-primary/5"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-white mb-3">Need help with another assignment?</h3>
            <p className="text-gray-400 mb-8">Get matched with qualified freelancers in minutes</p>
            <button
              onClick={() => setIsPostJobModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all inline-flex items-center gap-2 hover:shadow-primary/30"
            >
              <Plus className="w-5 h-5" />
              Create New Job
            </button>
          </div>
        </div>
      </div>

      {/* Job Posting Modal */}
      <JobPostingModal
        open={isPostJobModalOpen}
        onOpenChange={setIsPostJobModalOpen}
      />
    </DashboardLayout>
  );
}
