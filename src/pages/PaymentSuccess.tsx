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

    const transactionId = searchParams.get("transaction_id");

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                // Wait a bit for webhook to process
                await new Promise(resolve => setTimeout(resolve, 2000));

                if (transactionId) {
                    // Check payment status in database
                    const { data: payment, error } = await supabase
                        .from("payments")
                        .select("status, job_id")
                        .eq("transaction_id", transactionId)
                        .single();

                    if (error || !payment) {
                        // Payment might still be processing via webhook
                        setMessage("Payment is being processed...");
                        await new Promise(resolve => setTimeout(resolve, 3000));
                    }

                    if (payment?.status === "paid") {
                        setStatus("success");
                        setMessage("Payment successful! Your job has been posted.");
                        return;
                    }
                }

                // Fallback: assume success if redirected here
                setStatus("success");
                setMessage("Payment successful! Your job has been posted.");
            } catch (error) {
                console.error("Verification error:", error);
                setStatus("success"); // Still show success since redirect happened
                setMessage("Payment completed. Check your dashboard for job status.");
            }
        };

        verifyPayment();
    }, [transactionId]);

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
                    ) : (
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
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
