import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Briefcase, CheckCircle2, Star, DollarSign,
  Clock, MessageSquare, Eye
} from "lucide-react";
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

  const statsArray = [
    { icon: Briefcase, label: "Active Jobs", value: stats.activeJobs.toString(), color: "text-primary" },
    { icon: CheckCircle2, label: "Completed", value: stats.completed.toString(), color: "text-success" },
    { icon: Star, label: "Rating", value: stats.rating > 0 ? stats.rating.toFixed(1) : "New", color: "text-primary" },
    { icon: DollarSign, label: "This Month", value: `$${stats.thisMonth.toFixed(0)}`, color: "text-success" },
  ];

  return (
    <DashboardLayout role="freelancer">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back, {userName}!</h1>
            <p className="text-sm md:text-base text-muted-foreground">Here's your freelance overview</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <Label htmlFor="status" className="font-semibold">Status:</Label>
            <div className="flex items-center gap-2">
              <Switch id="status" checked={isAvailable} onCheckedChange={handleStatusToggle} />
              <Badge className={isAvailable ? "bg-success/20 text-success border-success" : "bg-muted/20 text-muted-foreground border-muted"}>
                <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-success' : 'bg-muted-foreground'} mr-2`} />
                {isAvailable ? "Available" : "Offline"}
              </Badge>
            </div>
          </div>
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

        {/* Active Jobs */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-6">Active Jobs</h2>
          {activeJobs.length === 0 ? (
            <Card className="p-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-bold mb-2">No active jobs</h3>
              <p className="text-muted-foreground mb-6">
                Browse available jobs and submit proposals to start earning
              </p>
              <Button onClick={() => navigate("/freelancer/browse-jobs")}>
                Find Work
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeJobs.map((job) => (
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
                            <span>{job.subject || "General"}</span>
                            <span className="hidden md:inline">•</span>
                            <span>{job.page_count} pages</span>
                            <span className="hidden md:inline">•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 md:w-4 md:h-4" />
                              Due {new Date(job.deadline).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground mt-2">
                            Hirer: {job.profiles?.full_name || "Unknown"}
                          </p>
                        </div>
                      </div>

                      <Badge className="bg-primary/20 text-primary border-primary">
                        In Progress
                      </Badge>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="default" size="sm" className="w-full sm:w-auto" onClick={() => navigate(`/freelancer/job/${job.id}`)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Job Details
                      </Button>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => navigate("/messages")}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message Hirer
                      </Button>
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
