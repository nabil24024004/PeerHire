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
import { DollarSign, CreditCard, Clock, Info, Calendar } from "lucide-react";
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
  payee: {
    full_name: string;
  };
}

export default function HirerPayments() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState({
    totalSpent: 0,
    tasksPaid: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    if (!authLoading && (!user || role !== "hirer")) {
      navigate("/");
    }
  }, [user, role, authLoading, navigate]);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;

      try {
        // We don't have a payments table, so calculate stats from completed jobs
        const { data: completedJobs, error: jobsError } = await supabase
          .from("jobs")
          .select("id, budget, status, updated_at")
          .eq("hirer_id", user.id)
          .eq("status", "completed");

        if (jobsError) throw jobsError;

        // Calculate stats from completed jobs
        const totalSpent = completedJobs?.reduce((sum, j) => sum + Number(j.budget), 0) || 0;
        const tasksPaid = completedJobs?.length || 0;

        // Count pending (in_progress jobs as pending payments)
        const { count: pendingCount } = await supabase
          .from("jobs")
          .select("*", { count: "exact", head: true })
          .eq("hirer_id", user.id)
          .eq("status", "in_progress");

        setStats({ totalSpent, tasksPaid, pendingPayments: pendingCount || 0 });
        setPayments([]); // No payments table, show empty for now
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to load payments",
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
      <DashboardLayout role="hirer">
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
    <DashboardLayout role="hirer">
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-bold gradient-text">Payments</h1>

        {/* Info Banner */}
        <Alert className="border-primary/50 bg-primary/10">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            <strong>bKash transaction integration will be added soon.</strong> Until then, use the Messenger method for payment coordination. Share bKash numbers through the chat system.
          </AlertDescription>
        </Alert>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Spent"
            value={`$${stats.totalSpent.toFixed(2)}`}
            icon={DollarSign}
            description="Lifetime spending"
          />
          <StatCard
            title="Tasks Paid"
            value={stats.tasksPaid}
            icon={CreditCard}
            description="Completed payments"
          />
          <StatCard
            title="Pending Payments"
            value={stats.pendingPayments}
            icon={Clock}
            description="Awaiting completion"
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
              Currently, all payments are coordinated through <strong>Messenger chat</strong>. When a freelancer completes your task:
            </p>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Message the freelancer through the chat system</li>
              <li>Exchange bKash numbers securely</li>
              <li>Complete the payment via bKash</li>
              <li>Confirm payment in the system</li>
            </ol>
            <p className="mt-3 text-sm text-primary">
              Direct bKash integration is coming soon for seamless transactions!
            </p>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="py-12 text-center">
                <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{payment.jobs?.title || "Unknown Task"}</p>
                      <p className="text-sm text-muted-foreground">
                        To: {payment.payee?.full_name || "Unknown"}
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
