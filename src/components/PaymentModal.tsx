import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DollarSign, Calendar } from "lucide-react";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: any;
  member: any;
  onSuccess: () => void;
}

const PaymentModal = ({ open, onOpenChange, payment, member, onSuccess }: PaymentModalProps) => {
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (payment && open) {
      const outstanding = Number(payment.amount_due) - Number(payment.amount_paid);
      setAmount(outstanding > 0 ? outstanding.toString() : "");
    }
  }, [payment, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment || !member) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("payments_ledger")
        .insert({
          monthly_payment_id: payment.id,
          member_id: member.id,
          amount: parseFloat(amount),
          payment_date: paymentDate,
          payment_method: paymentMethod,
          reference: reference || null,
        });

      if (error) throw error;

      toast.success("ادائیگی رجسٹر ہوگئی! Payment recorded successfully");

      // Send receipt via WhatsApp
      const receiptMessage = `*PAYMENT RECEIPT*\n\nMember: ${member.name}\nAmount Paid: Rs. ${parseFloat(amount).toLocaleString()}\nPayment Date: ${paymentDate}\nPayment Method: ${paymentMethod}\nReference: ${reference || 'N/A'}\n\nThank you for your payment!`;
      const whatsappUrl = `https://wa.me/${member.phone_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(receiptMessage)}`;
      window.open(whatsappUrl, '_blank');

      onSuccess();
      setAmount("");
      setReference("");
    } catch (error: any) {
      console.error("Error recording payment:", error);
      toast.error(error.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [1000, 2000, 3000, 5000, 7500, 10000];
  const outstanding = payment ? Number(payment.amount_due) - Number(payment.amount_paid) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            {member?.name} - {payment?.month}/{payment?.year}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Info */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Due:</span>
              <span className="font-semibold">Rs. {Number(payment?.amount_due || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Already Paid:</span>
              <span className="font-semibold text-success">Rs. {Number(payment?.amount_paid || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-muted-foreground">Outstanding:</span>
              <span className="font-bold text-lg text-destructive">Rs. {outstanding.toLocaleString()}</span>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <Label>Quick Amounts (Rs.)</Label>
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  type="button"
                  variant="outline"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="h-12 text-sm"
                >
                  {quickAmount.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (Rs.) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  required
                  className="pl-10 h-12 text-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-date">Payment Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="pl-10 h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <select
                id="payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-12 px-3 rounded-md border border-input bg-background"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="online">Online Payment</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Reference / Receipt # (Optional)</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g., Receipt #1234"
                className="h-12"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-12"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 h-12" disabled={loading}>
                {loading ? "Recording..." : "Record Payment"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
