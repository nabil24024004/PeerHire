import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, RefreshCw, Home } from "lucide-react";

export default function PaymentCancel() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardContent className="pt-8 pb-8 text-center">
                    <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="h-10 w-10 text-red-500" />
                    </div>

                    <h1 className="text-2xl font-bold mb-2 text-red-500">Payment Cancelled</h1>
                    <p className="text-muted-foreground mb-8">
                        Your payment was cancelled. No charges were made.
                        You can try again or return to your dashboard.
                    </p>

                    <div className="space-y-3">
                        <Button
                            className="w-full"
                            onClick={() => navigate(-1)}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => navigate("/hirer/dashboard")}
                        >
                            <Home className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
