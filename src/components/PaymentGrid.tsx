import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  year: number;
  month: number;
  amount_due: number;
  amount_paid: number;
  status: string;
  due_date: string;
  paid_on?: string;
}

interface PaymentGridProps {
  memberId: string;
  onPaymentClick: (payment: Payment) => void;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const PaymentGrid = ({ memberId, onPaymentClick }: PaymentGridProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchPayments();
  }, [memberId]);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("monthly_payments")
        .select("*")
        .eq("member_id", memberId)
        .eq("year", currentYear)
        .order("month");

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentForMonth = (month: number) => {
    return payments.find(p => p.month === month);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-paid/20 border-paid text-paid hover:bg-paid/30";
      case "partial":
        return "bg-partial/20 border-partial text-partial hover:bg-partial/30";
      case "overdue":
        return "bg-overdue/20 border-overdue text-overdue hover:bg-overdue/30";
      default:
        return "bg-muted border-border text-muted-foreground hover:bg-muted/50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return "✓";
      case "partial":
        return "◐";
      case "overdue":
        return "⚠";
      default:
        return "○";
    }
  };

  return (
    <Card className="border-border/50 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Payments {currentYear}</span>
          <Badge variant="outline">{payments.length} / 12 months</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {MONTHS.map((monthName, index) => {
            const monthNumber = index + 1;
            const payment = getPaymentForMonth(monthNumber);
            const status = payment?.status || "not-due";

            return (
              <button
                key={monthNumber}
                onClick={() => payment && onPaymentClick(payment)}
                disabled={!payment}
                className={cn(
                  "relative aspect-square rounded-xl border-2 transition-all",
                  "flex flex-col items-center justify-center gap-1 p-3",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  payment && "cursor-pointer active:scale-95",
                  getStatusColor(status)
                )}
              >
                <div className="text-2xl leading-none">{getStatusIcon(status)}</div>
                <div className="text-xs font-medium">{monthName}</div>
                {payment && (
                  <div className="text-[10px] font-mono">
                    {Number(payment.amount_paid).toLocaleString()}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-paid/20 border-2 border-paid" />
            <span className="text-muted-foreground">Paid</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-partial/20 border-2 border-partial" />
            <span className="text-muted-foreground">Partial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-overdue/20 border-2 border-overdue" />
            <span className="text-muted-foreground">Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-muted border-2 border-border" />
            <span className="text-muted-foreground">Not Due</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentGrid;
