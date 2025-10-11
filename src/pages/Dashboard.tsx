import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users, DollarSign, AlertCircle, TrendingUp, LogOut, Menu, Wallet } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import MembersList from "@/components/MembersList";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalCollected: 0,
    totalDue: 0,
    overdueCount: 0,
  });

  useEffect(() => {
    checkAuth();
    fetchStats();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    } else {
      setUser(session.user);
    }
  };

  const fetchStats = async () => {
    try {
      // Total members
      const { count: memberCount } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("active", true);

      // Get current month payments
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      const { data: payments } = await supabase
        .from("monthly_payments")
        .select("amount_due, amount_paid, status")
        .eq("year", currentYear)
        .eq("month", currentMonth);

      const collected = payments?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;
      const due = payments?.reduce((sum, p) => sum + (Number(p.amount_due) - Number(p.amount_paid)), 0) || 0;
      const overdue = payments?.filter(p => p.status === "overdue").length || 0;

      setStats({
        totalMembers: memberCount || 0,
        totalCollected: collected,
        totalDue: due,
        overdueCount: overdue,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">MemberPay</h1>
              <p className="text-xs text-muted-foreground">Payment Manager</p>
            </div>
          </div>
          
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalMembers}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">Rs. {stats.totalCollected.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Due Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">Rs. {stats.totalDue.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{stats.overdueCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Members List */}
        <MembersList />
      </main>
    </div>
  );
};

export default Dashboard;
