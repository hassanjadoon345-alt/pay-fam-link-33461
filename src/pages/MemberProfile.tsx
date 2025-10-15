import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, MessageCircle, Phone, Mail, MapPin, Calendar, DollarSign, Trash2 } from "lucide-react";
import PaymentGrid from "@/components/PaymentGrid";
import PaymentModal from "@/components/PaymentModal";
import DeleteMemberDialog from "@/components/DeleteMemberDialog";
import { generatePaymentMessage, sendWhatsAppMessage } from "@/utils/whatsappMessages";

interface Member {
  id: string;
  name: string;
  father_name: string;
  phone_number: string;
  alternate_phone?: string;
  email?: string;
  address?: string;
  joining_date: string;
  membership_type: string;
  monthly_fee: number;
  active: boolean;
  notes?: string;
}

const MemberProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (id) {
      fetchMember();
    }
  }, [id]);

  const fetchMember = async () => {
    try {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setMember(data);
    } catch (error) {
      console.error("Error fetching member:", error);
      toast.error("Failed to load member details");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    if (!member) return;
    const currentMonth = new Date().toLocaleDateString('ur-PK', { month: 'long' });
    const message = generatePaymentMessage(member.name, currentMonth, member.monthly_fee, 'unpaid');
    sendWhatsAppMessage(member.phone_number, message);
  };

  const handleCall = () => {
    if (!member) return;
    window.open(`tel:${member.phone_number}`);
  };

  const handlePaymentClick = (payment: any) => {
    setSelectedPayment(payment);
    setPaymentModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Member not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold truncate">{member.name}</h1>
            <p className="text-xs text-muted-foreground">{member.membership_type}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Member Info Card */}
        <Card className="border-border/50 shadow-card">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl">{member.name}</CardTitle>
                {member.father_name && (
                  <p className="text-sm text-muted-foreground">والد: {member.father_name}</p>
                )}
              </div>
              <Badge variant={member.active ? "default" : "destructive"}>
                {member.active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Contact Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleCall} variant="outline" className="gap-2 h-12">
                <Phone className="h-4 w-4" />
                Call
              </Button>
              <Button onClick={handleWhatsApp} className="gap-2 h-12 bg-success hover:bg-success/90">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </div>

            {/* Details */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-mono">{member.phone_number}</span>
              </div>
              {member.alternate_phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-mono text-muted-foreground">{member.alternate_phone}</span>
                </div>
              )}
              {member.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
              )}
              {member.address && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{member.address}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>Joined: {new Date(member.joining_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-semibold text-primary">
                  Monthly Fee: Rs. {Number(member.monthly_fee).toLocaleString()}
                </span>
              </div>
            </div>

            {member.notes && (
              <div className="pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground">{member.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Grid */}
        <PaymentGrid 
          memberId={member.id}
          memberPhone={member.phone_number}
          memberName={member.name}
          onPaymentClick={handlePaymentClick}
          refreshTrigger={refreshTrigger}
        />
      </main>

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        payment={selectedPayment}
        member={member}
        onSuccess={() => {
          setPaymentModalOpen(false);
          setRefreshTrigger(prev => prev + 1);
          fetchMember();
        }}
      />

      {/* Delete Member Dialog */}
      <DeleteMemberDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        memberId={member.id}
        memberName={member.name}
      />
    </div>
  );
};

export default MemberProfile;
