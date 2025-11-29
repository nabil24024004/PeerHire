import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePayments } from "@/hooks/usePayments";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: string;
    payerId: string;
    payeeId: string;
    defaultAmount?: number;
}

export function PaymentModal({
    isOpen,
    onClose,
    jobId,
    payerId,
    payeeId,
    defaultAmount = 0,
}: PaymentModalProps) {
    const [amount, setAmount] = useState(defaultAmount.toString());
    const [paymentMethod, setPaymentMethod] = useState("stripe");
    const [loading, setLoading] = useState(false);
    const { createPayment } = usePayments(payerId);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data, error } = await createPayment({
            job_id: jobId,
            payer_id: payerId,
            payee_id: payeeId,
            amount: parseFloat(amount),
            payment_method: paymentMethod,
        });

        setLoading(false);

        if (error) {
            toast({
                title: "Error",
                description: "Failed to create payment. Please try again.",
                variant: "destructive",
            });
        } else {
            toast({
                title: "Success",
                description: "Payment initiated successfully!",
            });
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Payment</DialogTitle>
                    <DialogDescription>
                        Enter payment details to complete the transaction
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Amount ($)</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="payment-method">Payment Method</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger id="payment-method">
                                    <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="stripe">Stripe</SelectItem>
                                    <SelectItem value="paypal">PayPal</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="bkash">bKash</SelectItem>
                                    <SelectItem value="nagad">Nagad</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Payment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
