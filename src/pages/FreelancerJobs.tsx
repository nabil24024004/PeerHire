import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, MessageSquare, FileText, Calendar, DollarSign, User, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  deadline: string;
  status: string;
  hirer: {
    full_name: string;
    id: string;
  };
  application_status?: string;
}

export default function FreelancerJobs() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    const checkRole = async () => {
      if (!authLoading && !user) {
        navigate("/");
        return;
      }

      // Check localStorage for active role
      if (!authLoading && user) {
        const activeRole = localStorage.getItem('activeRole');
        if (activeRole === 'hirer') {
          navigate("/hirer/dashboard");
        }
      }
    };

    checkRole();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!user) return;

      try {
        // Fetch jobs from applications
        const { data: applicationsData, error: applicationsError } = await supabase
          .from("applications")
          .select(`
            id,
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
              profiles!jobs_hirer_id_fkey (
                id,
                full_name
              )
            )
          `)
          .eq("freelancer_id", user.id)
          .order("created_at", { ascending: false });


        if (applicationsError) throw applicationsError;

        console.log('Raw applications data:', applicationsData);

        const formattedJobs = (applicationsData || [])
          .filter((app: any) => app.jobs)
          .map((app: any) => ({
            ...app.jobs,
            application_status: app.status,
            hirer: {
              full_name: app.jobs.profiles?.full_name || "Unknown",
              id: app.jobs.hirer_id,
            },
          }));

        console.log('Formatted jobs:', formattedJobs);
        console.log('Jobs with accepted status:', formattedJobs.filter((j: any) => j.application_status === 'accepted'));

        setJobs(formattedJobs);
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to load jobs",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [user, toast]);

  const getFilteredJobs = () => {
    switch (activeTab) {
      case "active":
        // Active = accepted applications with in_progress or assigned jobs
        return jobs.filter((job) =>
          job.application_status === "accepted" &&
          (job.status === "in_progress" || job.status === "assigned")
        );
      case "pending":
        return jobs.filter((job) => job.application_status === "pending");
      case "completed":
        // Completed = accepted applications with completed jobs
        return jobs.filter((job) =>
          job.application_status === "accepted" &&
          job.status === "completed"
        );
      default:
        return jobs;
    }
  };


  const handleWithdrawApplication = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("job_id", jobId)
        .eq("freelancer_id", user?.id);

      if (error) throw error;

      toast({
        title: "Application Withdrawn",
        description: "Your application has been withdrawn",
      });

      // Refresh jobs
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to withdraw application",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
      case "assigned":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "completed":
        return "bg-success/20 text-success border-success/50";
      case "pending":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout role="freelancer">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const filteredJobs = getFilteredJobs();

  return (
    <DashboardLayout role="freelancer">
      <div className="space-y-6">
        {/* Header */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-green-900/30 to-card/80 backdrop-blur border border-white/10">
          <h1 className="text-2xl md:text-3xl font-black">
            My{" "}
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Jobs
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track your active and completed work</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-full md:max-w-md bg-card/60 border border-white/5">
            <TabsTrigger value="active" className="text-xs data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">Active</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">Pending</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredJobs.length === 0 ? (
              <Card className="bg-card/60 backdrop-blur border-white/5">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-muted-foreground">
                    {activeTab === "active"
                      ? "No active jobs right now"
                      : activeTab === "pending"
                        ? "No pending applications"
                        : "No completed jobs yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredJobs.map((job) => (
                  <Card key={job.id} className="p-4 bg-card/60 backdrop-blur border-white/5 hover:border-green-500/20 transition-all duration-300 group">
                    <div className="flex flex-col gap-4">
                      {/* Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-6 h-6 text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg truncate group-hover:text-green-400 transition-colors">{job.title}</h3>
                            <button
                              onClick={() => navigate(`/hirer/profile/${job.hirer.id}`)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-green-400 transition-colors mt-1"
                            >
                              <User className="w-3 h-3" />
                              {job.hirer.full_name}
                            </button>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span>{job.category || 'General'}</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(job.deadline).toLocaleDateString()}
                              </span>
                              <span className="text-green-400 font-semibold">৳{job.budget}</span>
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(job.application_status || job.status)}>
                          {(job.application_status || job.status).replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {job.description}
                      </p>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-emerald-500"
                          onClick={() => navigate(`/freelancer/job/${job.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/10"
                          onClick={() => navigate(`/messages?chat=${job.hirer.id}`)}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        {activeTab === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={() => handleWithdrawApplication(job.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Withdraw
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
