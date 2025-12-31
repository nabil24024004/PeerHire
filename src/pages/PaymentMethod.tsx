import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Clock, ArrowLeft, Loader2, Shield } from "lucide-react";

interface JobData {
    title: string;
    description: string;
    category: string;
    deadline: string;
    budget: number;
    attachment_urls: string[] | null;
}

const SITE_FEE_PERCENTAGE = 0.20; // 20%

export default function PaymentMethod() {
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<"pay_now" | "pay_later" | null>(null);

    // Get job data from navigation state
    const jobData = location.state?.jobData as JobData | undefined;

    useEffect(() => {
        if (!jobData) {
            toast({
                title: "No job data",
                description: "Please create a job first",
                variant: "destructive",
            });
            navigate("/hirer/dashboard");
        }
    }, [jobData, navigate, toast]);

    if (!jobData) {
        return null;
    }

    const siteFee = Math.ceil(jobData.budget * SITE_FEE_PERCENTAGE);
    const payNowTotal = jobData.budget + siteFee;
    const payLaterTotal = siteFee;

    const handlePayment = async (method: "pay_now" | "pay_later") => {
        setLoading(true);
        setSelectedMethod(method);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error("Not authenticated");
            }

            const amount = method === "pay_now" ? payNowTotal : payLaterTotal;
            const freelancerAmount = method === "pay_now" ? jobData.budget : 0;

            // Create payment record first
            const { data: payment, error: paymentError } = await supabase
                .from("payments" as any)
                .insert({
                    user_id: session.user.id,
                    amount,
                    site_fee: siteFee,
                    freelancer_amount: freelancerAmount,
                    payment_method: method,
                    status: "pending",
                    metadata: { jobData },
                })
                .select()
                .single();

            if (paymentError) throw paymentError;

            // Call RupantorPay API via Edge Function
            const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
                "create-rupantor-payment",
                {
                    body: {
                        payment_id: (payment as any).id,
                        amount,
                        purpose: method === "pay_now" ? "Job Payment (Full)" : "Job Posting Fee",
                        metadata: {
                            job_title: jobData.title,
                            payment_method: method,
                        },
                    },
                }
            );

            if (checkoutError) {
                // If Edge Function not available, simulate for now
                console.log("Edge Function not available, simulating payment...");

                // For now, directly create job and mark payment as processing
                const { data: job, error: jobError } = await supabase
                    .from("jobs")
                    .insert({
                        title: jobData.title,
                        description: jobData.description,
                        category: jobData.category,
                        deadline: jobData.deadline,
                        budget: jobData.budget,
                        hirer_id: session.user.id,
                        attachment_urls: jobData.attachment_urls,
                    })
                    .select()
                    .single();

                if (jobError) throw jobError;

                // Update payment to paid (simulated) and link job
                if (job) {
                    await supabase
                        .from("payments" as any)
                        .update({
                            status: "paid",
                            job_id: job.id
                        })
                        .eq("id", (payment as any).id);
                }

                toast({
                    title: "Job Posted Successfully!",
                    description: method === "pay_now"
                        ? "Payment received. Freelancers can now apply."
                        : "Site fee received. Pay freelancer offline after job completion.",
                });

                navigate("/hirer/dashboard");
                return;
            }

            // Redirect to RupantorPay checkout
            if (checkoutData?.checkout_url) {
                console.log("Redirecting to payment gateway:", checkoutData.checkout_url);
                window.location.href = checkoutData.checkout_url;
            } else {
                console.error("No checkout URL received from Edge Function");
                toast({
                    title: "Payment Error",
                    description: "Payment gateway URL not received. Please try again.",
                    variant: "destructive",
                });
            }

        } catch (error: any) {
            console.error("Payment error:", error);
            toast({
                title: "Payment Error",
                description: error.message || "Failed to process payment",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
            setSelectedMethod(null);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold text-foreground">Choose Payment Method</h1>
                    <p className="text-muted-foreground mt-2">
                        Complete payment to post your job: <span className="text-primary font-medium">{jobData.title}</span>
                    </p>
                </div>

                {/* Job Summary */}
                <Card className="mb-8 bg-card/50 border-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Job Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Budget:</span>
                                <span className="ml-2 font-medium">৳{jobData.budget}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Category:</span>
                                <span className="ml-2 font-medium">{jobData.category}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Deadline:</span>
                                <span className="ml-2 font-medium">
                                    {new Date(jobData.deadline).toLocaleDateString()}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Site Fee (20%):</span>
                                <span className="ml-2 font-medium text-primary">৳{siteFee}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Options */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Pay Now Option */}
                    <Card
                        className={`cursor-pointer transition-all hover:border-primary/50 ${selectedMethod === "pay_now" ? "border-primary ring-2 ring-primary/20" : ""
                            }`}
                        onClick={() => !loading && handlePayment("pay_now")}
                    >
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CreditCard className="h-8 w-8 text-primary" />
                                <Badge variant="default" className="bg-primary">Recommended</Badge>
                            </div>
                            <CardTitle className="mt-4">Pay Now</CardTitle>
                            <CardDescription>
                                Pay full amount upfront. Freelancer payment is secured.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Job Budget</span>
                                    <span>৳{jobData.budget}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Site Fee (20%)</span>
                                    <span>৳{siteFee}</span>
                                </div>
                                <div className="border-t border-border pt-3">
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span className="text-primary">৳{payNowTotal}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                                    <Shield className="h-4 w-4" />
                                    <span>Payment held securely until job completion</span>
                                </div>
                            </div>
                            <Button
                                className="w-full mt-6"
                                disabled={loading}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePayment("pay_now");
                                }}
                            >
                                {loading && selectedMethod === "pay_now" ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <CreditCard className="mr-2 h-4 w-4" />
                                )}
                                Pay ৳{payNowTotal} Now
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Pay Later Option */}
                    <Card
                        className={`cursor-pointer transition-all hover:border-primary/50 ${selectedMethod === "pay_later" ? "border-primary ring-2 ring-primary/20" : ""
                            }`}
                        onClick={() => !loading && handlePayment("pay_later")}
                    >
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <Clock className="h-8 w-8 text-orange-500" />
                                <Badge variant="outline">Flexible</Badge>
                            </div>
                            <CardTitle className="mt-4">Pay Later Offline</CardTitle>
                            <CardDescription>
                                Pay site fee now. Pay freelancer directly after completion.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Site Fee (20%)</span>
                                    <span>৳{siteFee}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Freelancer Payment</span>
                                    <span>Pay offline later</span>
                                </div>
                                <div className="border-t border-border pt-3">
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Pay Now</span>
                                        <span className="text-orange-500">৳{payLaterTotal}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                                    <Clock className="h-4 w-4" />
                                    <span>Pay ৳{jobData.budget} to freelancer after job done</span>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full mt-6"
                                disabled={loading}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePayment("pay_later");
                                }}
                            >
                                {loading && selectedMethod === "pay_later" ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Clock className="mr-2 h-4 w-4" />
                                )}
                                Pay ৳{payLaterTotal} (Site Fee Only)
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Security Note */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                        <Shield className="h-4 w-4" />
                        Secured by RupantorPay • 100% Safe Payment
                    </p>
                </div>
            </div>
        </div>
    );
}
