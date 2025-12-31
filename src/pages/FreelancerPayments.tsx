import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Clock, Info, Calendar, MessageCircle, AlertCircle } from "lucide-react";
import { TakaIcon } from "@/components/icons/TakaIcon";
import { Skeleton } from "@/components/ui/skeleton";

interface AcceptedJob {
  job_id: string;
  job_title: string;
  job_budget: number;
  job_status: string;
  payment_method: "pay_now" | "pay_later" | null;
  accepted_at: string;
}

export default function FreelancerPayments() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [acceptedJobs, setAcceptedJobs] = useState<AcceptedJob[]>([]);
  const [stats, setStats] = useState({
    totalEarned: 0,
    completedJobs: 0,
    payNowJobs: 0,
    payLaterJobs: 0,
  });

  useEffect(() => {
    const checkRole = async () => {
      if (!authLoading && !user) {
        navigate("/");
        return;
      }

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
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, student_id, department, email")
          .eq("id", user.id)
          .single();

        setUserProfile(profile);

        // Get accepted applications with job details
        const { data: applications, error: appsError } = await supabase
          .from("applications")
          .select(`
            job_id,
            created_at,
            jobs!inner (
              id,
              title,
              budget,
              status,
              hirer_id
            )
          `)
          .eq("freelancer_id", user.id)
          .eq("status", "accepted");

        if (appsError) throw appsError;

        // For each job, get the payment method from payments table
        const jobsWithPaymentMethod: AcceptedJob[] = [];

        for (const app of applications || []) {
          const job = (app.jobs as any);

          // Find payment record for this job
          // For backward compatibility: if no payment found, default to "pay_later"
          // Using 'as any' because payments table may not be in generated types yet
          const { data: payment } = await (supabase as any)
            .from("payments")
            .select("payment_method")
            .eq("user_id", job.hirer_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(); // Use maybeSingle to avoid errors when no record exists

          jobsWithPaymentMethod.push({
            job_id: job.id,
            job_title: job.title,
            job_budget: job.budget,
            job_status: job.status,
            // Default to "pay_later" for legacy jobs without payment records
            payment_method: payment?.payment_method || "pay_later",
            accepted_at: app.created_at
          });
        }

        setAcceptedJobs(jobsWithPaymentMethod);

        // Calculate stats
        const completed = jobsWithPaymentMethod.filter(j => j.job_status === 'completed');
        const totalEarned = completed.reduce((sum, j) => sum + Number(j.job_budget), 0);
        const payNowCount = jobsWithPaymentMethod.filter(j => j.payment_method === 'pay_now').length;
        const payLaterCount = jobsWithPaymentMethod.filter(j => j.payment_method === 'pay_later').length;

        setStats({
          totalEarned,
          completedJobs: completed.length,
          payNowJobs: payNowCount,
          payLaterJobs: payLaterCount,
        });

      } catch (error: any) {
        console.error("Error:", error);
        toast({
          title: "Error",
          description: "Failed to load payment information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  const generateWhatsAppLink = () => {
    if (!userProfile) return "#";

    const message = `Hello, I'm a freelancer on PeerHire requesting payment.

Name: ${userProfile.full_name || "N/A"}
Student ID: ${userProfile.student_id || "N/A"}
Department: ${userProfile.department || "N/A"}
Email: ${userProfile.email || "N/A"}

Please process my payment. Thank you!`;

    return `https://wa.me/8801788992953?text=${encodeURIComponent(message)}`;
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout role="freelancer">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const payNowJobs = acceptedJobs.filter(j => j.payment_method === 'pay_now');
  const payLaterJobs = acceptedJobs.filter(j => j.payment_method === 'pay_later');

  return (
    <DashboardLayout role="freelancer">
      <div className="space-y-6">
        {/* Header */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-green-900/30 to-card/80 backdrop-blur border border-white/10">
          <h1 className="text-2xl md:text-3xl font-black">
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Payments & Earnings
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track your earnings and payment status</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Earned"
            value={`৳${stats.totalEarned.toFixed(0)}`}
            icon={TakaIcon}
            description="Completed jobs"
          />
          <StatCard
            title="Completed Jobs"
            value={stats.completedJobs}
            icon={Briefcase}
            description="Finished work"
          />
          <StatCard
            title="Pay Now Jobs"
            value={stats.payNowJobs}
            icon={Clock}
            description="Platform payments"
          />
          <StatCard
            title="Pay Later Jobs"
            value={stats.payLaterJobs}
            icon={AlertCircle}
            description="Direct payments"
          />
        </div>

        {/* Pay Now Instructions */}
        {payNowJobs.length > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                Platform Payment Jobs (Pay Now)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-primary/50">
                <Info className="h-4 w-4" />
                <AlertTitle>Payment Processing Time</AlertTitle>
                <AlertDescription>
                  Payments will arrive within <strong>2-3 working days</strong> after job completion is verified.
                </AlertDescription>
              </Alert>

              <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                <p className="text-sm font-medium">For payment inquiries, contact our developer:</p>
                <Button
                  onClick={() => {
                    const link = generateWhatsAppLink();
                    if (link && link !== "#") {
                      window.open(link, '_blank');
                    }
                  }}
                  disabled={!userProfile}
                  className="w-full sm:w-auto gap-2"
                  variant="default"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp: +880 1788-992953
                </Button>
                <p className="text-xs text-muted-foreground">
                  Your profile details will be automatically included in the message.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Your Pay Now Jobs:</p>
                {payNowJobs.map((job) => (
                  <div
                    key={job.job_id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border border-border bg-card/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{job.job_title}</p>
                      <p className="text-xs text-muted-foreground">
                        Accepted: {new Date(job.accepted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {job.job_status}
                      </Badge>
                      <p className="text-sm font-bold text-primary">৳{job.job_budget}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pay Later Instructions */}
        {payLaterJobs.length > 0 && (
          <Card className="border-orange-500/50 bg-orange-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Direct Payment Jobs (Pay Later)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-orange-500/50 bg-orange-500/10">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <AlertTitle className="text-orange-500">Payment Instructions</AlertTitle>
                <AlertDescription>
                  For these jobs, <strong>get your money directly from the hirer</strong>. The platform does not process these payments.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Your Pay Later Jobs:</p>
                {payLaterJobs.map((job) => (
                  <div
                    key={job.job_id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border border-orange-500/30 bg-card/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{job.job_title}</p>
                      <p className="text-xs text-muted-foreground">
                        Accepted: {new Date(job.accepted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/50">
                        Pay Later
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {job.job_status}
                      </Badge>
                      <p className="text-sm font-bold text-orange-500">৳{job.job_budget}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Jobs Message */}
        {acceptedJobs.length === 0 && (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium text-muted-foreground">No accepted jobs yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start browsing and applying to jobs to see your earnings here
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
