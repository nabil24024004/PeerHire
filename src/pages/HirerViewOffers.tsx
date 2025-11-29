import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  CheckCircle, XCircle, MessageSquare
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
  cover_letter: string;
  proposed_price: number;
  status: string;
  created_at: string;
  freelancer_id: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
    rating: number | null;
    total_reviews: number | null;
  };
  freelancer_profiles: {
    skills: string[] | null;
    total_jobs_completed: number | null;
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

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/login");
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      if (roleData?.role !== 'hirer') {
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
        .from('job_applications')
        .select(`
          *,
          profiles!job_applications_freelancer_id_fkey(
            full_name, 
            avatar_url, 
            rating, 
            total_reviews
          )
        `)
        .eq('job_id', taskId)
        .order('created_at', { ascending: false });

      if (applicationsError) throw applicationsError;

      // Fetch freelancer profiles separately for each application
      const applicationsWithProfiles = await Promise.all(
        (applicationsData || []).map(async (app) => {
          const { data: freelancerProfile } = await supabase
            .from('freelancer_profiles')
            .select('skills, total_jobs_completed')
            .eq('user_id', app.freelancer_id)
            .single();

          return {
            ...app,
            freelancer_profiles: freelancerProfile || { skills: null, total_jobs_completed: null },
          };
        })
      );

      setApplications(applicationsWithProfiles);
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
        .from('job_applications')
        .update({ status: 'accepted' })
        .eq('id', application.id);

      if (acceptError) throw acceptError;

      // Reject all other applications
      const { error: rejectError } = await supabase
        .from('job_applications')
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
        .from('job_applications')
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
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('hirer_id', session.user.id)
        .eq('freelancer_id', freelancerId)
        .eq('job_id', taskId)
        .maybeSingle();

      if (existingConversation) {
        navigate(`/messages?conversation=${existingConversation.id}`);
      } else {
        // Create new conversation
        const { data: newConversation, error } = await supabase
          .from('conversations')
          .insert({
            hirer_id: session.user.id,
            freelancer_id: freelancerId,
            job_id: taskId,
          })
          .select('id')
          .single();

        if (error) throw error;

        navigate(`/messages?conversation=${newConversation.id}`);
      }
    } catch (error: any) {
      toast({
        title: "Error starting conversation",
        description: error.message,
        variant: "destructive",
      });
    }
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/hirer/tasks")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Applications</h1>
            <p className="text-muted-foreground">Review and manage applications for your job</p>
          </div>
        </div>

        {/* Job Summary */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">{job.title}</h2>
          <p className="text-muted-foreground mb-4">{job.description}</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span>{job.work_type}</span>
            </div>
            {job.subject && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{job.subject}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">•</span>
              <span>{job.page_count} pages</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-success" />
              <span className="font-semibold">${job.budget}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-warning" />
              <span>Due: {new Date(job.deadline).toLocaleDateString()}</span>
            </div>
          </div>
        </Card>

        {/* Applications List */}
        <div>
          <h2 className="text-xl font-bold mb-4">
            {applications.length} {applications.length === 1 ? 'Application' : 'Applications'}
          </h2>

          {applications.length === 0 ? (
            <Card className="p-12 text-center">
              <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-bold mb-2">No applications yet</h3>
              <p className="text-muted-foreground">
                Freelancers will see your job and submit their proposals
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <Card key={application.id} className="p-6">
                  <div className="space-y-4">
                    {/* Freelancer Info */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                          {application.profiles.full_name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">{application.profiles.full_name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            {application.profiles.rating !== null && application.profiles.rating > 0 ? (
                              <>
                                <Star className="w-4 h-4 fill-primary text-primary" />
                                <span>{application.profiles.rating.toFixed(1)}</span>
                                <span>({application.profiles.total_reviews || 0} reviews)</span>
                              </>
                            ) : (
                              <span>New freelancer</span>
                            )}
                            {application.freelancer_profiles?.total_jobs_completed !== null && (
                              <>
                                <span>•</span>
                                <span>{application.freelancer_profiles.total_jobs_completed} jobs completed</span>
                              </>
                            )}
                          </div>
                          {application.freelancer_profiles?.skills && application.freelancer_profiles.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {application.freelancer_profiles.skills.slice(0, 3).map((skill, idx) => (
                                <Badge key={idx} variant="secondary">{skill}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Proposed Price</p>
                        <p className="text-2xl font-bold text-success">${application.proposed_price}</p>
                      </div>
                    </div>

                    {/* Cover Letter */}
                    <div className="border-t border-border pt-4">
                      <h4 className="font-semibold mb-2">Cover Letter</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {application.cover_letter}
                      </p>
                    </div>

                    {/* Application Date */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>Applied {new Date(application.created_at).toLocaleDateString()}</span>
                    </div>

                    {/* Actions */}
                    {application.status === 'pending' && (
                      <div className="flex gap-2 pt-4 border-t border-border">
                        <Button
                          onClick={() => openConfirmDialog(application, "accept")}
                          className="flex-1"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept & Assign
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleMessageFreelancer(application.freelancer_id)}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => openConfirmDialog(application, "reject")}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                    {application.status !== 'pending' && (
                      <Badge className={application.status === 'accepted' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}>
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
