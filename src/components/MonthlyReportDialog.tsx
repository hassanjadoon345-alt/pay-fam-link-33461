import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { downloadExcelReport, downloadPDFReport, MonthlyReport, ReportMember } from "@/utils/reportGenerator";

interface MonthlyReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: number;
  year: number;
}

const MONTHS_URDU = [
  'جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون',
  'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'
];

const MonthlyReportDialog = ({ open, onOpenChange, month, year }: MonthlyReportDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<MonthlyReport | null>(null);

  useEffect(() => {
    if (open) {
      fetchReportData();
    }
  }, [open, month, year]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { data: payments, error } = await supabase
        .from("monthly_payments")
        .select(`
          *,
          members (name)
        `)
        .eq("month", month)
        .eq("year", year)
        .order("members(name)");

      if (error) throw error;

      const members: ReportMember[] = payments.map((p: any) => ({
        name: p.members.name,
        amount_due: p.amount_due,
        amount_paid: p.amount_paid,
        status: p.status,
        paid_on: p.paid_on
      }));

      const totalPaid = payments
        .filter((p: any) => p.status === 'paid')
        .reduce((sum: number, p: any) => sum + Number(p.amount_paid), 0);

      const totalUnpaid = payments
        .filter((p: any) => p.status === 'due')
        .reduce((sum: number, p: any) => sum + Number(p.amount_due - p.amount_paid), 0);

      const totalOverdue = payments
        .filter((p: any) => p.status === 'overdue')
        .reduce((sum: number, p: any) => sum + Number(p.amount_due - p.amount_paid), 0);

      setReportData({
        month,
        year,
        members,
        totalPaid,
        totalUnpaid,
        totalOverdue
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error("رپورٹ لوڈ کرنے میں خرابی");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = () => {
    if (!reportData) return;
    downloadExcelReport(reportData);
    toast.success("Excel رپورٹ ڈاؤن لوڈ ہو گئی");
  };

  const handleDownloadPDF = () => {
    if (!reportData) return;
    downloadPDFReport(reportData);
    toast.success("PDF رپورٹ ڈاؤن لوڈ ہو گئی");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            ماہانہ رپورٹ - {MONTHS_URDU[month - 1]} {year}
          </DialogTitle>
          <DialogDescription>
            Download monthly payment summary report
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">لوڈ ہو رہا ہے...</div>
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <div className="text-sm text-muted-foreground">کل ادا شدہ</div>
                <div className="text-2xl font-bold text-success">
                  Rs. {Number(reportData.totalPaid).toLocaleString()}
                </div>
              </div>
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <div className="text-sm text-muted-foreground">کل باقی</div>
                <div className="text-2xl font-bold text-warning">
                  Rs. {Number(reportData.totalUnpaid).toLocaleString()}
                </div>
              </div>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="text-sm text-muted-foreground">کل مدت گزرہ</div>
                <div className="text-2xl font-bold text-destructive">
                  Rs. {Number(reportData.totalOverdue).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Members Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Member Name</th>
                      <th className="px-4 py-3 text-right font-medium">Amount Due</th>
                      <th className="px-4 py-3 text-right font-medium">Amount Paid</th>
                      <th className="px-4 py-3 text-center font-medium">Status</th>
                      <th className="px-4 py-3 text-center font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reportData.members.map((member, idx) => (
                      <tr key={idx} className="hover:bg-muted/50">
                        <td className="px-4 py-3">{member.name}</td>
                        <td className="px-4 py-3 text-right font-mono">
                          Rs. {Number(member.amount_due).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          Rs. {Number(member.amount_paid).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            member.status === 'paid' 
                              ? 'bg-success/10 text-success' 
                              : member.status === 'overdue'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-warning/10 text-warning'
                          }`}>
                            {member.status === 'paid' ? 'Paid' : member.status === 'overdue' ? 'Overdue' : 'Unpaid'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {member.paid_on ? new Date(member.paid_on).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Download Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                onClick={handleDownloadExcel}
                variant="outline"
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Download Excel
              </Button>
              <Button
                onClick={handleDownloadPDF}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default MonthlyReportDialog;
