import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, User, Star, DollarSign, FileText, Calendar,
  CheckCircle, XCircle, MessageSquare, ArrowUpDown
} from "lucide-react";

interface JobData {
  id: string;
  title: string;
  description: string;
  subject: string | null;
  work_type: string;
  page_count: number;
  budget: number;
  deadline: string;
  status: string;
}

interface Application {
  id: string;
  cover_letter: string | null;
  proposed_rate: number | null;
  status: string;
  created_at: string;
  freelancer_id: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
    rating: number | null;
    total_reviews: number;
    skills: string[] | null;
  };
}

export default function HirerViewOffers() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<JobData | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [actionType, setActionType] = useState<"accept" | "reject" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sortBy, setSortBy] = useState<string>("newest");

  const sortedApplications = useMemo(() => {
    const sorted = [...applications];
    switch (sortBy) {
      case "price_low":
        return sorted.sort((a, b) => (a.proposed_rate || 0) - (b.proposed_rate || 0));
      case "price_high":
        return sorted.sort((a, b) => (b.proposed_rate || 0) - (a.proposed_rate || 0));
      case "rating_high":
        return sorted.sort((a, b) => (b.profiles.rating || 0) - (a.profiles.rating || 0));
      case "newest":
      default:
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [applications, sortBy]);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
        return;
      }

      // Check active role from localStorage
      const activeRole = localStorage.getItem('activeRole');
      if (activeRole !== 'hirer') {
        navigate("/freelancer/dashboard");
        return;
      }

      await fetchJobAndApplications(session.user.id);
    };

    checkAuthAndFetch();
  }, [taskId, navigate]);

  const fetchJobAndApplications = async (userId: string) => {
    try {
      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', taskId)
        .eq('hirer_id', userId)
        .single();

      if (jobError) throw jobError;
      if (!jobData) {
        toast({
          title: "Job not found",
          description: "This job doesn't exist or you don't have access to it.",
          variant: "destructive",
        });
        navigate("/hirer/tasks");
        return;
      }

      setJob(jobData);

      // Fetch applications with freelancer details
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select(`
          *,
          profiles!applications_freelancer_id_fkey(
            full_name, 
            avatar_url, 
            rating, 
            total_reviews,
            skills
          )
        `)
        .eq('job_id', taskId)
        .order('created_at', { ascending: false });

      if (applicationsError) throw applicationsError;

      setApplications(applicationsData || []);
      setLoading(false);
    } catch (error: any) {
      toast({
        title: "Error loading offers",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleAcceptApplication = async (application: Application) => {
    setIsProcessing(true);
    try {
      // Update job status and assign freelancer
      const { error: jobError } = await supabase
        .from('jobs')
        .update({
          status: 'assigned',
          freelancer_id: application.freelancer_id,
        })
        .eq('id', taskId);

      if (jobError) throw jobError;

      // Update accepted application status
      const { error: acceptError } = await supabase
        .from('applications')
        .update({ status: 'accepted' })
        .eq('id', application.id);

      if (acceptError) throw acceptError;

      // Reject all other applications
      const { error: rejectError } = await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('job_id', taskId)
        .neq('id', application.id);

      if (rejectError) throw rejectError;

      toast({
        title: "Application accepted",
        description: `${application.profiles.full_name} has been assigned to this job.`,
      });

      navigate("/hirer/tasks");
    } catch (error: any) {
      toast({
        title: "Error accepting application",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setActionType(null);
      setSelectedApplication(null);
    }
  };

  const handleRejectApplication = async (application: Application) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('id', application.id);

      if (error) throw error;

      toast({
        title: "Application rejected",
        description: "The freelancer has been notified.",
      });

      // Remove from list
      setApplications(prev => prev.filter(app => app.id !== application.id));
    } catch (error: any) {
      toast({
        title: "Error rejecting application",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setActionType(null);
      setSelectedApplication(null);
    }
  };

  const handleMessageFreelancer = async (freelancerId: string) => {
    // Navigate directly to messages with chat parameter
    navigate(`/messages?chat=${freelancerId}`);
  };

  const openConfirmDialog = (application: Application, type: "accept" | "reject") => {
    setSelectedApplication(application);
    setActionType(type);
  };

  if (loading) {
    return (
      <DashboardLayout role="hirer">
        <div className="space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <DashboardLayout role="hirer">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/hirer/tasks")} className="flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold truncate">Applications</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Review and manage applications for your job</p>
          </div>
        </div>

        {/* Job Summary */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 break-words">{job.title}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-3">{job.description}</p>
          <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1 sm:gap-2">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
              <span className="truncate">{job.work_type}</span>
            </div>
            {job.subject && (
              <span className="truncate">• {job.subject}</span>
            )}
            <span>• {job.page_count} pages</span>
            <div className="flex items-center gap-1 sm:gap-2">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success flex-shrink-0" />
              <span className="font-semibold">{job.budget}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-warning flex-shrink-0" />
              <span>Due: {new Date(job.deadline).toLocaleDateString()}</span>
            </div>
          </div>
        </Card>

        {/* Applications List */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-bold">
              {applications.length} {applications.length === 1 ? 'Application' : 'Applications'}
            </h2>
            {applications.length > 1 && (
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs sm:text-sm">
                  <ArrowUpDown className="w-3.5 h-3.5 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="rating_high">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {applications.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center">
              <User className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
              <h3 className="text-base sm:text-lg font-bold mb-2">No applications yet</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Freelancers will see your job and submit their proposals
              </p>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {sortedApplications.map((application) => (
                <Card key={application.id} className="p-3 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {/* Freelancer Info */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base sm:text-xl flex-shrink-0">
                          {application.profiles.full_name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm sm:text-lg font-bold break-words">{application.profiles.full_name}</h3>
                            <div className="text-right flex-shrink-0 sm:hidden">
                              <p className="text-[10px] text-muted-foreground">Proposed</p>
                              <p className="text-base font-bold text-success">${application.proposed_rate || 0}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground mt-1">
                            {application.profiles.rating !== null && application.profiles.rating > 0 ? (
                              <>
                                <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-primary text-primary" />
                                <span>{application.profiles.rating.toFixed(1)}</span>
                                <span>({application.profiles.total_reviews || 0} reviews)</span>
                              </>
                            ) : (
                              <span>New freelancer</span>
                            )}
                            {application.freelancer_profiles?.total_jobs_completed !== null && (
                              <>
                                <span>•</span>
                                <span>{application.freelancer_profiles.total_jobs_completed} jobs</span>
                              </>
                            )}
                          </div>
                          {application.freelancer_profiles?.skills && application.freelancer_profiles.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
                              {application.freelancer_profiles.skills.slice(0, 3).map((skill, idx) => (
                                <Badge key={idx} variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0.5">{skill}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 hidden sm:block">
                        <p className="text-xs sm:text-sm text-muted-foreground">Proposed Price</p>
                        <p className="text-xl sm:text-2xl font-bold text-success">${application.proposed_rate || 0}</p>
                      </div>
                    </div>

                    {/* Cover Letter */}
                    <div className="border-t border-border pt-3 sm:pt-4">
                      <h4 className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2">Cover Letter</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap break-words">
                        {application.cover_letter}
                      </p>
                    </div>

                    {/* Application Date */}
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                      <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span>Applied {new Date(application.created_at).toLocaleDateString()}</span>
                    </div>

                    {/* Actions */}
                    {application.status === 'pending' && (
                      <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2 pt-3 sm:pt-4 border-t border-border">
                        <Button
                          onClick={() => openConfirmDialog(application, "accept")}
                          className="text-[10px] sm:text-xs px-2 sm:px-3"
                          size="sm"
                        >
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                          <span className="hidden sm:inline">Accept</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleMessageFreelancer(application.freelancer_id)}
                          size="sm"
                          className="text-[10px] sm:text-xs px-2 sm:px-3"
                        >
                          <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                          <span className="hidden sm:inline">Message</span>
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => openConfirmDialog(application, "reject")}
                          size="sm"
                          className="text-[10px] sm:text-xs px-2 sm:px-3"
                        >
                          <XCircle className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                          <span className="hidden sm:inline">Reject</span>
                        </Button>
                      </div>
                    )}
                    {application.status !== 'pending' && (
                      <Badge className={`text-xs ${application.status === 'accepted' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                        {application.status.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!actionType} onOpenChange={() => { setActionType(null); setSelectedApplication(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "accept" ? "Accept Application?" : "Reject Application?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "accept" ? (
                <>
                  You are about to accept <strong>{selectedApplication?.profiles.full_name}</strong>'s application
                  and assign them to this job. This will reject all other applications.
                  The job status will change to "Assigned" and you can start working with the freelancer.
                </>
              ) : (
                <>
                  Are you sure you want to reject <strong>{selectedApplication?.profiles.full_name}</strong>'s application?
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedApplication) {
                  actionType === "accept"
                    ? handleAcceptApplication(selectedApplication)
                    : handleRejectApplication(selectedApplication);
                }
              }}
              disabled={isProcessing}
              className={actionType === "reject" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {isProcessing ? "Processing..." : actionType === "accept" ? "Accept & Assign" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
