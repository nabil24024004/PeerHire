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
        return jobs.filter((job) => job.status === "in_progress" || job.status === "assigned");
      case "pending":
        return jobs.filter((job) => job.application_status === "pending");
      case "completed":
        return jobs.filter((job) => job.status === "completed");
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
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">My Jobs</h1>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-full md:max-w-md">
            <TabsTrigger value="active" className="text-xs md:text-sm">Active</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs md:text-sm">Pending</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs md:text-sm">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredJobs.length === 0 ? (
              <Card className="border-border">
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">
                    {activeTab === "active"
                      ? "No active jobs right now"
                      : activeTab === "pending"
                        ? "No pending applications"
                        : "No completed jobs yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredJobs.map((job) => (
                  <Card key={job.id} className="card-hover border-border">
                    <CardHeader className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg md:text-xl mb-2 break-words">{job.title}</CardTitle>
                          <button
                            onClick={() => navigate(`/hirer/profile/${job.hirer.id}`)}
                            className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors mb-2"
                          >
                            <User className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{job.hirer.full_name}</span>
                          </button>
                          <div className="flex flex-wrap gap-2 text-xs md:text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{job.category || 'General'}</span>
                            </span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(job.application_status || job.status)}>
                          {(job.application_status || job.status).replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0">
                      <p className="text-xs md:text-sm text-muted-foreground mb-4 line-clamp-2">
                        {job.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4 text-xs md:text-sm">
                        <div className="flex items-center gap-1 text-primary">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold">{job.budget}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span className="truncate">Due: {new Date(job.deadline).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => navigate(`/freelancer/job/${job.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Open Job
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => navigate(`/messages?chat=${job.hirer.id}`)}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Message Hirer
                        </Button>
                        {activeTab === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto border-destructive/50 text-destructive hover:bg-destructive/20"
                            onClick={() => handleWithdrawApplication(job.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Withdraw
                          </Button>
                        )}
                      </div>
                    </CardContent>
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
