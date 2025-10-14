import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DollarSign, Calendar, TrendingUp, LogOut, Download, User } from "lucide-react";
import { downloadPDFReport } from "@/utils/reportGenerator";

const MemberDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [memberData, setMemberData] = useState<any>(null);
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalDue: 0,
    monthlyFee: 0,
  });
  const [yearlyPayments, setYearlyPayments] = useState<any[]>([]);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    await fetchMemberData(session.user.id);
  };

  const fetchMemberData = async (userId: string) => {
    try {
      // Get member profile
      const { data: member, error: memberError } = await supabase
        .from("members")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (memberError) throw memberError;
      if (!member) {
        toast.error("آپ کا اکاؤنٹ کسی ممبر سے منسلک نہیں ہے");
        await supabase.auth.signOut();
        navigate("/auth");
        return;
      }

      setMemberData(member);

      // Get current year payments
      const currentYear = new Date().getFullYear();
      const { data: payments } = await supabase
        .from("monthly_payments")
        .select("*")
        .eq("member_id", member.id)
        .eq("year", currentYear)
        .order("month");

      setYearlyPayments(payments || []);

      const paid = payments?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;
      const due = payments?.reduce((sum, p) => sum + (Number(p.amount_due) - Number(p.amount_paid)), 0) || 0;

      setStats({
        totalPaid: paid,
        totalDue: due,
        monthlyFee: Number(member.monthly_fee),
      });
    } catch (error) {
      console.error("Error fetching member data:", error);
      toast.error("ڈیٹا لوڈ کرنے میں خرابی");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("آپ لاگ آؤٹ ہو گئے ہیں");
    navigate("/auth");
  };

  const handleDownloadYearlyStatement = () => {
    if (!memberData || !yearlyPayments) return;

    const currentYear = new Date().getFullYear();
    const reportData = {
      month: 0,
      year: currentYear,
      members: yearlyPayments.map(p => ({
        name: memberData.name,
        amount_due: p.amount_due,
        amount_paid: p.amount_paid,
        status: p.status,
        paid_on: p.paid_on
      })),
      totalPaid: stats.totalPaid,
      totalUnpaid: stats.totalDue,
      totalOverdue: 0
    };

    downloadPDFReport(reportData);
    toast.success("سالانہ رپورٹ ڈاؤن لوڈ ہو گئی");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">لوڈ ہو رہا ہے...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Hazara Mayyat Committee</h1>
              <p className="text-xs text-muted-foreground">{memberData?.name}</p>
            </div>
          </div>
          
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Member Info Card */}
        <Card className="border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="text-right">ممبر کی تفصیلات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">نام:</span>
              <span className="font-medium">{memberData?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">فون نمبر:</span>
              <span className="font-medium">{memberData?.phone_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ماہانہ فیس:</span>
              <span className="font-medium">Rs. {Number(memberData?.monthly_fee).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/50 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                کل ادا شدہ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">Rs. {stats.totalPaid.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                باقی رقم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">Rs. {stats.totalDue.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                ماہانہ فیس
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">Rs. {stats.monthlyFee.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Download Statement */}
        <Button
          onClick={handleDownloadYearlyStatement}
          className="w-full gap-2"
          size="lg"
        >
          <Download className="h-5 w-5" />
          سالانہ رپورٹ ڈاؤن لوڈ کریں
        </Button>

        {/* Monthly Payments */}
        <Card className="border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="text-right">ماہانہ ادائیگیاں {new Date().getFullYear()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {yearlyPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      payment.status === 'paid' ? 'bg-success' :
                      payment.status === 'overdue' ? 'bg-destructive' : 'bg-warning'
                    }`} />
                    <span className="font-medium">
                      {new Date(2000, payment.month - 1).toLocaleString('ur-PK', { month: 'long' })}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">Rs. {Number(payment.amount_paid).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {payment.status === 'paid' ? 'ادا شدہ' : payment.status === 'overdue' ? 'مدت گزرہ' : 'باقی'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MemberDashboard;
