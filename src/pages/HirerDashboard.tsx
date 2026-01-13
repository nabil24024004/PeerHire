import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { JobPostingModal } from "@/components/JobPostingModal";
import {
  LayoutDashboard,
  User,
  Briefcase,
  Radio,
  MessageSquare,
  Wallet,
  Settings,
  Pin,
  LogOut,
  Search,
  Bell,
  Plus,
  CheckCircle2,
  Star,
  FileText,
  Clock,
  Eye,
  ChevronRight,
  PinOff
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
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

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
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();

    if (data) {
      if (data.full_name) setUserName(data.full_name.split(" ")[0]);
      if (data.avatar_url) setUserAvatar(data.avatar_url);
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

      // Get total spent from payments (with type assertion)
      const { data: paymentsData } = await (supabase as any)
        .from("payments")
        .select("amount")
        .eq("user_id", user.id)
        .eq("status", "paid");

      const totalSpent = paymentsData?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;

      // Get avg rating
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("rating")
        .eq("reviewer_id", user.id);

      const avgRating = reviewsData?.length
        ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length
        : 5.0; // Default to 5.0 if no ratings yet to match design

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const getStatusBadge = (job: JobWithApplications) => {
    if (job.status === "completed") {
      return (
        <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 dark:bg-green-900/20 dark:text-green-500 text-xs font-medium border border-green-500/20 dark:border-green-900/30">
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

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-dark text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300 min-h-screen overflow-hidden flex">
      {/* Sidebar */}
      <aside className="w-72 h-screen flex flex-col justify-between p-6 border-r border-gray-200 dark:border-gray-800 bg-background-light dark:bg-background-dark shrink-0 overflow-y-auto">
        <div>
          <div className="mb-10 flex items-center gap-2 px-2">
            <span className="text-2xl font-bold text-primary tracking-tight">PeerHire</span>
          </div>
          <nav className="space-y-2">
            <a onClick={() => navigate("/hirer/dashboard")} className="flex items-center gap-3 px-4 py-3 bg-primary/10 dark:bg-surface-dark border border-primary/20 dark:border-primary/20 rounded-xl text-primary font-medium transition-all shadow-glow-sm cursor-pointer">
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </a>
            <a onClick={() => navigate("/hirer/profile")} className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-surface-dark-hover rounded-xl transition-all cursor-pointer">
              <User className="w-5 h-5" />
              Profile
            </a>
            <a onClick={() => navigate("/hirer/tasks")} className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-surface-dark-hover rounded-xl transition-all cursor-pointer">
              <Briefcase className="w-5 h-5" />
              My Tasks
            </a>
            <a onClick={() => navigate("/hirer/live-board")} className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-surface-dark-hover rounded-xl transition-all cursor-pointer">
              <Radio className="w-5 h-5" />
              Live Board
            </a>
            <a onClick={() => navigate("/hirer/messages")} className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-surface-dark-hover rounded-xl transition-all cursor-pointer">
              <MessageSquare className="w-5 h-5" />
              Messages
            </a>
            <a onClick={() => navigate("/hirer/payments")} className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-surface-dark-hover rounded-xl transition-all cursor-pointer">
              <Wallet className="w-5 h-5" />
              Payments
            </a>
            <a onClick={() => navigate("/hirer/settings")} className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-surface-dark-hover rounded-xl transition-all cursor-pointer">
              <Settings className="w-5 h-5" />
              Settings
            </a>
          </nav>
        </div>
        <div className="space-y-2 mt-auto">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-primary/5 dark:bg-surface-dark/50 text-gray-600 dark:text-gray-300 hover:text-primary rounded-xl transition-all group">
            <Pin className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
            Unpin
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-20 flex items-center justify-between px-8 border-b border-gray-200 dark:border-gray-800 bg-background-light dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-20">
          <div className="w-1/3">
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 dark:text-gray-500 group-focus-within:text-primary transition-colors">
                <Search className="w-5 h-5" />
              </span>
              <input
                className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent block pl-10 p-2.5 placeholder-gray-400 dark:placeholder-gray-500 transition-all outline-none"
                placeholder="Search jobs, students, subjects..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="bg-gray-200 dark:bg-surface-dark p-1 rounded-xl flex items-center">
              <button className="bg-primary text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-glow-sm">Hirer</button>
              <button onClick={() => navigate('/freelancer/dashboard')} className="text-gray-500 dark:text-gray-400 text-xs font-medium px-4 py-1.5 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1">
                <Search className="w-3.5 h-3.5" /> Freelancer
              </button>
            </div>
            <button className="relative text-gray-500 dark:text-gray-400 hover:text-primary transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full border-2 border-background-light dark:border-background-dark"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-800">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{userName || "Hirer"}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Hirer</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 p-0.5">
                {userAvatar ? (
                  <img
                    alt="User Avatar"
                    className="h-full w-full rounded-full object-cover border-2 border-background-light dark:border-background-dark"
                    src={userAvatar}
                  />
                ) : (
                  <div className="h-full w-full rounded-full bg-surface-dark flex items-center justify-center border-2 border-background-light dark:border-background-dark">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-surface-dark to-surface-dark relative overflow-hidden rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className="text-primary text-sm font-medium mb-1">{getGreeting()}</p>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome back, <span className="text-secondary">{userName || "Hirer"}</span></h1>
                <p className="text-gray-500 dark:text-gray-400">Manage your tasks and hire talented peers</p>
              </div>
              <button
                onClick={() => setIsPostJobModalOpen(true)}
                className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl shadow-glow transition-all flex items-center gap-2 font-medium"
              >
                <Plus className="w-5 h-5" />
                Post New Job
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center gap-4 hover:border-primary/50 transition-colors cursor-default">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Open Tasks</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.openTasks}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center gap-4 hover:border-accent-teal/50 transition-colors cursor-default">
              <div className="h-12 w-12 rounded-xl bg-accent-teal/20 flex items-center justify-center text-accent-teal">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedTasks}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center gap-4 hover:border-accent-blue/50 transition-colors cursor-default">
              <div className="h-12 w-12 rounded-xl bg-accent-blue/20 flex items-center justify-center text-accent-blue">
                <span className="font-bold text-lg">৳</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">৳{stats.totalSpent}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center gap-4 hover:border-accent-orange/50 transition-colors cursor-default">
              <div className="h-12 w-12 rounded-xl bg-accent-orange/20 flex items-center justify-center text-accent-orange">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Avg. Rating</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgRating.toFixed(1)}</p>
              </div>
            </div>
          </div>

          {/* Your Tasks */}
          <div>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Tasks</h2>
              <button
                onClick={() => navigate("/hirer/tasks")}
                className="text-sm text-primary hover:text-secondary font-medium flex items-center gap-1 transition-colors"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {recentJobs.length === 0 ? (
                <div className="bg-white dark:bg-surface-dark rounded-2xl p-10 border border-gray-200 dark:border-gray-800 text-center">
                  <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No tasks yet. Create your first job posting!</p>
                </div>
              ) : (
                recentJobs.map((job) => (
                  <div key={job.id} className="bg-white dark:bg-surface-dark rounded-2xl p-5 border border-gray-200 dark:border-gray-800 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-surface-dark-hover transition-colors group">
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 dark:bg-primary/5 flex items-center justify-center text-primary border border-primary/20">
                        {/* Static icon based on design, or could use dynamic category icon */}
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{job.title}</h3>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>{job.category || "General"}</span>
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {job.deadline ? new Date(job.deadline).toLocaleDateString() : "No Deadline"}
                          </span>
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          <span className="text-primary font-semibold">৳{job.budget}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(job)}
                      <button
                        onClick={() => navigate(`/hirer/task/${job.id}/offers`)}
                        className="bg-primary/10 hover:bg-primary text-primary hover:text-white px-5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 group-hover:shadow-glow-sm"
                      >
                        <Eye className="w-4.5 h-4.5" />
                        View
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-10 text-center border border-gray-800 relative overflow-hidden mb-8">
            <div className="absolute top-0 left-0 w-full h-full bg-primary/5"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-white mb-3">Need help with another assignment?</h3>
              <p className="text-gray-400 mb-8">Get matched with qualified freelancers in minutes</p>
              <button
                onClick={() => setIsPostJobModalOpen(true)}
                className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-semibold shadow-glow transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create New Job
              </button>
            </div>
          </div>
        </div>
      </main>

      <JobPostingModal
        open={isPostJobModalOpen}
        onOpenChange={setIsPostJobModalOpen}
      />
    </div>
  );
}
