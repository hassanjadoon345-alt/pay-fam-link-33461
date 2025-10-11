import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Wallet, Users, TrendingUp, MessageCircle } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center shadow-glow">
            <Wallet className="h-10 w-10 text-primary" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              MemberPay
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            ممبر اور ادائیگی کا نظام
          </p>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Mobile-first payment management system for members with WhatsApp integration
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-8">
          <div className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur">
            <Users className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Member Management</h3>
            <p className="text-sm text-muted-foreground">Track all member details and payment history</p>
          </div>
          <div className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur">
            <TrendingUp className="h-8 w-8 text-success mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Payment Tracking</h3>
            <p className="text-sm text-muted-foreground">Visual monthly grid with status indicators</p>
          </div>
          <div className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur">
            <MessageCircle className="h-8 w-8 text-success mx-auto mb-3" />
            <h3 className="font-semibold mb-2">WhatsApp Integration</h3>
            <p className="text-sm text-muted-foreground">Quick reminders via WhatsApp</p>
          </div>
        </div>

        <div className="pt-8">
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="h-14 px-8 text-lg gap-2"
          >
            Get Started
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Sign up to start managing your members
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
