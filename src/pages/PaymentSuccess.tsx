import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Home, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
    const [message, setMessage] = useState("Verifying your payment...");

    // We now prefer payment_id, but keep transaction_id as fallback support
    const paymentId = searchParams.get("payment_id");
    const transactionId = searchParams.get("transaction_id");

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                if (!paymentId && !transactionId) {
                    setStatus("error");
                    setMessage("No payment credential provided. Please contact support.");
                    return;
                }

                // Wait for webhook to process
                await new Promise(resolve => setTimeout(resolve, 2000));

                let query = (supabase.from("payments") as any).select("status, job_id, transaction_id");

                if (paymentId) {
                    query = query.eq("id", paymentId);
                } else if (transactionId) {
                    query = query.eq("transaction_id", transactionId);
                }

                // Check payment status in database
                const { data: payment, error } = await query.single();

                if (error || !payment) {
                    // Wait a bit longer for webhook
                    setMessage("Payment is being processed...");
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    // Try again
                    const { data: retryPayment } = await query.single();

                    if (!retryPayment) {
                        setStatus("error");
                        // Don't show confusing placeholder if transactionId is missing or literal placeholder
                        const idToShow = paymentId || (transactionId !== "{transaction_id}" ? transactionId : "N/A");
                        setMessage(`Payment verification failed. Please contact support with ID: ${idToShow}`);
                        return;
                    }

                    if (retryPayment.status === "paid") {
                        setStatus("success");
                        setMessage("Payment successful! Your job has been posted.");
                        return;
                    }
                }

                if (payment?.status === "paid") {
                    setStatus("success");
                    setMessage("Payment successful! Your job has been posted.");
                } else if (payment?.status === "processing") {
                    setStatus("processing");
                    setMessage("Payment is still being processed. Please wait...");
                } else {
                    setStatus("error");
                    // Filter out invalid/technical statuses if needed to show user-friendly message
                    setMessage("Payment could not be verified. Status: " + (payment?.status || "unknown"));
                }
            } catch (error) {
                console.error("Verification error:", error);
                setStatus("error");
                setMessage("Error verifying payment. Please check your payments page or contact support.");
            }
        };

        verifyPayment();
    }, [paymentId, transactionId]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardContent className="pt-8 pb-8 text-center">
                    {status === "processing" ? (
                        <>
                            <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin mb-6" />
                            <h1 className="text-2xl font-bold mb-2">Processing Payment</h1>
                            <p className="text-muted-foreground mb-6">{message}</p>
                        </>
                    ) : status === "success" ? (
                        <>
                            <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="h-10 w-10 text-green-500" />
                            </div>
                            <h1 className="text-2xl font-bold mb-2 text-green-500">Payment Successful!</h1>
                            <p className="text-muted-foreground mb-8">{message}</p>

                            <div className="space-y-3">
                                <Button
                                    className="w-full"
                                    onClick={() => navigate("/hirer/dashboard")}
                                >
                                    <Home className="mr-2 h-4 w-4" />
                                    Go to Dashboard
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => navigate("/hirer/tasks")}
                                >
                                    <Briefcase className="mr-2 h-4 w-4" />
                                    View My Jobs
                                </Button>
                            </div>
                        </>
                    ) : (
                        // Error State
                        <>
                            <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-2xl">❌</span>
                            </div>
                            <h1 className="text-2xl font-bold mb-2 text-red-500">Payment Failed</h1>
                            <p className="text-muted-foreground mb-8">{message}</p>

                            <div className="space-y-3">
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={() => navigate("/hirer/dashboard")}
                                >
                                    Go to Dashboard
                                </Button>
                                <Button
                                    className="w-full"
                                    onClick={() => window.location.reload()}
                                >
                                    Try Verifying Again
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
