import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePayments } from "@/hooks/usePayments";
import { formatDistanceToNow } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentHistoryProps {
    userId: string;
}

export function PaymentHistory({ userId }: PaymentHistoryProps) {
    const { payments, loading } = usePayments(userId);

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                    View all your payment transactions
                </CardDescription>
            </CardHeader>
            <CardContent>
                {payments.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">No payment history yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {payments.map((payment) => {
                            const isReceived = payment.payee_id === userId;
                            const jobTitle = (payment.jobs as any)?.title || "Unknown Job";

                            return (
                                <div
                                    key={payment.id}
                                    className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={cn(
                                                "p-2 rounded-full",
                                                isReceived
                                                    ? "bg-green-100 text-green-600"
                                                    : "bg-red-100 text-red-600"
                                            )}
                                        >
                                            {isReceived ? (
                                                <ArrowDownLeft className="h-4 w-4" />
                                            ) : (
                                                <ArrowUpRight className="h-4 w-4" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium">{jobTitle}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatDistanceToNow(new Date(payment.created_at), {
                                                    addSuffix: true,
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p
                                            className={cn(
                                                "font-semibold",
                                                isReceived ? "text-green-600" : "text-red-600"
                                            )}
                                        >
                                            {isReceived ? "+" : "-"}${payment.amount.toFixed(2)}
                                        </p>
                                        <Badge
                                            variant={
                                                payment.status === "completed"
                                                    ? "default"
                                                    : payment.status === "pending"
                                                        ? "secondary"
                                                        : "destructive"
                                            }
                                        >
                                            {payment.status}
                                        </Badge>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
