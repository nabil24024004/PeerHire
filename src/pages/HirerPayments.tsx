import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Shield
} from "lucide-react";
import { TakaIcon } from "@/components/icons/TakaIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Payment {
  id: string;
  amount: number;
  site_fee: number;
  freelancer_amount: number;
  payment_method: string;
  status: string;
  transaction_id: string | null;
  created_at: string;
  metadata: {
    jobData?: {
      title: string;
    };
  } | null;
}

export default function HirerPayments() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState({
    totalSpent: 0,
    paidCount: 0,
    pendingCount: 0,
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
        // Fetch payments from the new payments table
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (paymentsError) throw paymentsError;

        const paymentsList = paymentsData || [];
        setPayments(paymentsList);

        // Calculate stats
        const paidPayments = paymentsList.filter(p => p.status === "paid");
        const pendingPayments = paymentsList.filter(p => p.status === "pending" || p.status === "processing");

        setStats({
          totalSpent: paidPayments.reduce((sum, p) => sum + Number(p.amount), 0),
          paidCount: paidPayments.length,
          pendingCount: pendingPayments.length,
        });

      } catch (error: any) {
        console.error("Fetch error:", error);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      case "pending":
      case "processing":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
            <Clock className="w-3 h-3 mr-1" />
            {status === "processing" ? "Processing" : "Pending"}
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodBadge = (method: string) => {
    if (method === "pay_now") {
      return (
        <Badge variant="outline" className="border-primary/50 text-primary">
          <Shield className="w-3 h-3 mr-1" />
          Pay Now
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-orange-500/50 text-orange-400">
        <Clock className="w-3 h-3 mr-1" />
        Pay Later
      </Badge>
    );
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Payments</h1>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-primary" />
            Secured by RupantorPay
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Spent"
            value={`৳${stats.totalSpent.toFixed(0)}`}
            icon={TakaIcon}
            description="Lifetime spending"
          />
          <StatCard
            title="Successful Payments"
            value={stats.paidCount}
            icon={CheckCircle}
            description="Completed transactions"
          />
          <StatCard
            title="Pending"
            value={stats.pendingCount}
            icon={Clock}
            description="Awaiting completion"
          />
        </div>

        {/* Payments List */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="paid">Paid</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <PaymentList
                  payments={payments}
                  getStatusBadge={getStatusBadge}
                  getMethodBadge={getMethodBadge}
                />
              </TabsContent>
              <TabsContent value="paid">
                <PaymentList
                  payments={payments.filter(p => p.status === "paid")}
                  getStatusBadge={getStatusBadge}
                  getMethodBadge={getMethodBadge}
                />
              </TabsContent>
              <TabsContent value="pending">
                <PaymentList
                  payments={payments.filter(p => p.status === "pending" || p.status === "processing")}
                  getStatusBadge={getStatusBadge}
                  getMethodBadge={getMethodBadge}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function PaymentList({
  payments,
  getStatusBadge,
  getMethodBadge
}: {
  payments: Payment[];
  getStatusBadge: (status: string) => JSX.Element;
  getMethodBadge: (method: string) => JSX.Element;
}) {
  if (payments.length === 0) {
    return (
      <div className="py-12 text-center">
        <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">No transactions yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Payments will appear here when you post jobs
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-border bg-card/50 hover:bg-muted/50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">
              {payment.metadata?.jobData?.title || "Job Payment"}
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(payment.created_at).toLocaleDateString()}
              </div>
              {payment.transaction_id && (
                <div className="flex items-center gap-1">
                  <span>ID: {payment.transaction_id.slice(0, 8)}...</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {getMethodBadge(payment.payment_method)}
            {getStatusBadge(payment.status)}
            <div className="text-left sm:text-right min-w-[80px]">
              <p className="text-lg font-bold text-primary">
                ৳{Number(payment.amount).toFixed(0)}
              </p>
              {payment.freelancer_amount > 0 && (
                <p className="text-xs text-muted-foreground">
                  +৳{payment.site_fee} fee
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
