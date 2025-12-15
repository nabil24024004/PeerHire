import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Briefcase, Clock, Info, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  jobs: {
    title: string;
  };
  payer: {
    full_name: string;
  };
}

export default function FreelancerPayments() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState({
    totalEarned: 0,
    completedJobs: 0,
    outstandingPayments: 0,
  });

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
    const fetchPayments = async () => {
      if (!user) return;

      try {
        // Get completed jobs via accepted applications
        const { data: completedApps, error: appsError } = await supabase
          .from("applications")
          .select(`
            job_id,
            status,
            jobs!inner (
              id,
              title,
              budget,
              status,
              hirer_id,
              updated_at
            )
          `)
          .eq("freelancer_id", user.id)
          .eq("status", "accepted");

        if (appsError) throw appsError;

        // Calculate stats from completed jobs
        const completedJobs = (completedApps || [])
          .filter(app => (app.jobs as any)?.status === 'completed');

        const totalEarned = completedJobs
          .reduce((sum, app) => sum + Number((app.jobs as any).budget || 0), 0);

        const inProgressJobs = (completedApps || [])
          .filter(app => (app.jobs as any)?.status === 'in_progress');

        setStats({
          totalEarned,
          completedJobs: completedJobs.length,
          outstandingPayments: inProgressJobs.length
        });
        setPayments([]); // No payments table, show empty
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to load earnings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [user, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success/20 text-success border-success/50";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "failed":
        return "bg-destructive/20 text-destructive border-destructive/50";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
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

  return (
    <DashboardLayout role="freelancer">
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-bold gradient-text">Earnings</h1>

        {/* Info Banner */}
        <Alert className="border-primary/50 bg-primary/10">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            <strong>bKash transaction integration will be added soon.</strong> Until then, receive payments through the Messenger method. Share your bKash number with hirers via chat.
          </AlertDescription>
        </Alert>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Earned"
            value={`$${stats.totalEarned.toFixed(2)}`}
            icon={DollarSign}
            description="Completed payments"
          />
          <StatCard
            title="Completed Jobs"
            value={stats.completedJobs}
            icon={Briefcase}
            description="Paid jobs"
          />
          <StatCard
            title="Outstanding Payments"
            value={stats.outstandingPayments}
            icon={Clock}
            description="Pending payments"
          />
        </div>

        {/* Payment Method Info */}
        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="w-5 h-5 text-primary" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Currently, all payments are received through <strong>Messenger chat</strong>. When you complete a job:
            </p>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Message the hirer through the chat system</li>
              <li>Share your bKash number securely</li>
              <li>Wait for the hirer to complete the payment</li>
              <li>Confirm receipt in the system</li>
            </ol>
            <p className="mt-3 text-sm text-primary">
              Direct bKash integration is coming soon for instant payments!
            </p>
          </CardContent>
        </Card>

        {/* Earnings List */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Earnings History</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="py-12 text-center">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">No earnings yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{payment.jobs?.title || "Unknown Job"}</p>
                      <p className="text-sm text-muted-foreground">
                        From: {payment.payer?.full_name || "Unknown"}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(payment.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="capitalize">
                        {payment.payment_method}
                      </Badge>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status.toUpperCase()}
                      </Badge>
                      <p className="text-lg font-bold text-primary">
                        ${Number(payment.amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
