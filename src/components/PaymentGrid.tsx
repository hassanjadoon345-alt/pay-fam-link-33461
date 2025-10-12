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
  memberPhone: string;
  memberName: string;
  onPaymentClick: (payment: Payment) => void;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const PaymentGrid = ({ memberId, memberPhone, memberName, onPaymentClick }: PaymentGridProps) => {
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

  const sendPaymentReminder = (payment: Payment, monthName: string) => {
    let message = '';
    
    if (payment.status === 'paid') {
      message = `Dear ${memberName},\n\nYour payment for ${monthName} ${currentYear} has been received.\n\nAmount Paid: Rs. ${payment.amount_paid}\nPaid On: ${payment.paid_on}\n\nThank you!`;
    } else if (payment.status === 'partial') {
      const outstanding = payment.amount_due - payment.amount_paid;
      message = `Dear ${memberName},\n\nPartial payment received for ${monthName} ${currentYear}.\n\nAmount Due: Rs. ${payment.amount_due}\nAmount Paid: Rs. ${payment.amount_paid}\nOutstanding: Rs. ${outstanding}\nDue Date: ${payment.due_date}\n\nPlease pay the remaining amount.`;
    } else if (payment.status === 'overdue') {
      message = `Dear ${memberName},\n\n⚠️ OVERDUE PAYMENT REMINDER\n\nYour payment for ${monthName} ${currentYear} is overdue.\n\nAmount Due: Rs. ${payment.amount_due}\nDue Date: ${payment.due_date}\n\nPlease make payment at your earliest convenience.`;
    } else {
      message = `Dear ${memberName},\n\nPayment reminder for ${monthName} ${currentYear}.\n\nAmount Due: Rs. ${payment.amount_due}\nDue Date: ${payment.due_date}\n\nPlease make payment before the due date.`;
    }
    
    const whatsappUrl = `https://wa.me/${memberPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
              <div key={monthNumber} className="relative group">
                <button
                  onClick={() => payment && onPaymentClick(payment)}
                  disabled={!payment}
                  className={cn(
                    "relative aspect-square rounded-xl border-2 transition-all w-full",
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
                {payment && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sendPaymentReminder(payment, monthName);
                    }}
                    className="absolute -top-2 -right-2 bg-green-600 hover:bg-green-700 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Send WhatsApp message"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </button>
                )}
              </div>
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
