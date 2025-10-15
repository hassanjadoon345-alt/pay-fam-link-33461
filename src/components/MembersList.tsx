import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  name: string;
  phone_number: string;
  monthly_fee: number;
  membership_type: string;
  active: boolean;
  total_due?: number;
  total_paid?: number;
}

const MembersList = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data: membersData, error } = await supabase
        .from("members")
        .select("id, name, phone_number, monthly_fee, membership_type, active")
        .eq("active", true)
        .order("name");

      if (error) throw error;

      // Fetch payment stats for each member
      const { data: paymentsData } = await supabase
        .from("monthly_payments")
        .select("member_id, amount_due, amount_paid");

      // Calculate totals per member
      const membersWithStats = (membersData || []).map(member => {
        const memberPayments = paymentsData?.filter(p => p.member_id === member.id) || [];
        const total_due = memberPayments.reduce((sum, p) => sum + (Number(p.amount_due) - Number(p.amount_paid)), 0);
        const total_paid = memberPayments.reduce((sum, p) => sum + Number(p.amount_paid), 0);
        
        return {
          ...member,
          total_due,
          total_paid
        };
      });

      setMembers(membersWithStats);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone_number.includes(searchQuery)
  );

  const maskPhone = (phone: string) => {
    if (phone.length < 6) return phone;
    return phone.slice(0, -6) + "****" + phone.slice(-2);
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const message = encodeURIComponent(`السلام علیکم ${name} صاحب`);
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  return (
    <Card className="border-border/50 shadow-card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-xl">Members</CardTitle>
          <Button onClick={() => navigate("/add-member")} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Member
          </Button>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading members...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No members found</div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                onClick={() => navigate(`/member/${member.id}`)}
                className="flex items-center justify-between p-4 rounded-xl border-2 border-border/50 hover:border-primary hover:shadow-lg hover:bg-primary/5 transition-all cursor-pointer active:scale-[0.98]"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{member.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{maskPhone(member.phone_number)}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {member.membership_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Monthly: Rs. {Number(member.monthly_fee).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="text-success font-medium">
                      Paid: Rs. {Number(member.total_paid || 0).toLocaleString()}
                    </span>
                    {member.total_due && member.total_due > 0 ? (
                      <span className="text-destructive font-medium">
                        Due: Rs. {Number(member.total_due).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        No dues
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWhatsApp(member.phone_number, member.name);
                  }}
                  className="flex-shrink-0"
                >
                  <MessageCircle className="h-5 w-5 text-success" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MembersList;
