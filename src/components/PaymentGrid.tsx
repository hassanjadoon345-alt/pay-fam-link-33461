import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";
import { toast } from "sonner";
import MonthlyReportDialog from "./MonthlyReportDialog";
import { generatePaymentMessage, sendWhatsAppMessage } from "@/utils/whatsappMessages";

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
// ✨ blank month ka default payment object
const makeBlankPayment = (monthNumber: number, year: number, memberId: string) => ({
  id: "",
  member_id: memberId,   // 👈 agar aapke model me 'memberId' hai to is naam ko usi ke mutabiq kar dein
  year,
  month: monthNumber,
  amount_due: 0,
  amount_paid: 0,
  status: "not-due",
  due_date: ""
});

const PaymentGrid = ({ memberId, memberPhone, memberName, onPaymentClick }: PaymentGridProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const currentYear = new Date().getFullYear();

  const paidCount = payments.filter(p => p.status === 'paid').length;

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
    const status = payment.status === 'paid' ? 'paid' : 
                   payment.status === 'overdue' ? 'overdue' : 'unpaid';
    
    const message = generatePaymentMessage(
      memberName,
      monthName,
      payment.amount_due,
      status as 'paid' | 'unpaid' | 'overdue'
    );
    
    sendWhatsAppMessage(memberPhone, message);
    toast.success("WhatsApp پر پیغام بھیجا جا رہا ہے");
  };

  const openMonthReport = (month: number) => {
    setSelectedMonth(month);
    setReportDialogOpen(true);
  };

  return (
    <Card className="border-border/50 shadow-card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl">Payment Overview {currentYear}</CardTitle>
            <div className="text-sm text-muted-foreground mt-1">
              {paidCount} / {MONTHS.length} months paid
            </div>
          </div>
          <Button
            onClick={() => openMonthReport(new Date().getMonth() + 1)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Current Month Report
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {MONTHS.map((monthName, index) => {
  const monthNumber = index + 1;
  const payment = getPaymentForMonth(monthNumber);
  const safePayment = payment ?? makeBlankPayment(monthNumber, currentYear, memberId);
  const status = safePayment.status;

  return (
    <div key={monthNumber} className="relative">
      <button
        type="button"
        onClick={() => onPaymentClick(safePayment)}
        className={`w-full h-full ${getStatusColor(status)} rounded-lg p-3`}
      >
        <div className="text-2xl leading-none">{getStatusIcon(status)}</div>
        <div className="text-xs font-medium">{monthName}</div>
        {safePayment && (
          <div className="text-[10px] font-mono">
            {Number(safePayment.amount_paid).toLocaleString()}
          </div>
        )}
      </button>

      {safePayment && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            sendPaymentReminder(safePayment, monthName);
          }}
          className="absolute -top-2 -right-2 bg-green-600 hover:bg-green-700 text-white rounded-full p-1"
          title="Send WhatsApp message"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 8l4 4-4 4M3 12h18" />
          </svg>
        </button>
      )}
    </div>
  );
})}
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

      <MonthlyReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        month={selectedMonth}
        year={currentYear}
      />
    </Card>
  );
};

export default PaymentGrid;
