import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

const transactionSchema = z.object({
  member_id: z.string().min(1, "Please select a member"),
  amount: z.string().min(1, "Amount is required"),
  payment_date: z.string().min(1, "Payment date is required"),
  payment_method: z.string().min(1, "Payment method is required"),
  reference: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface Member {
  id: string;
  name: string;
  phone_number: string;
  monthly_fee: number;
}

const AddTransaction = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("members")
        .select("id, name, phone_number, monthly_fee")
        .eq("active", true)
        .order("name");

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load members");
    }
  };

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      member_id: "",
      amount: "",
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: "cash",
      reference: "",
      notes: "",
    },
  });

  const onSubmit = async (data: TransactionFormData) => {
    setLoading(true);
    try {
      const paymentDate = new Date(data.payment_date);
      const month = paymentDate.getMonth() + 1;
      const year = paymentDate.getFullYear();

      // Get or create monthly_payment record
      const { data: monthlyPayment, error: fetchError } = await supabase
        .from("monthly_payments")
        .select("*")
        .eq("member_id", data.member_id)
        .eq("month", month)
        .eq("year", year)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let monthlyPaymentId = monthlyPayment?.id;

      if (!monthlyPaymentId) {
        // Create monthly payment record if it doesn't exist
        const member = members.find((m) => m.id === data.member_id);
        const { data: newMonthlyPayment, error: createError } = await supabase
          .from("monthly_payments")
          .insert([
            {
              member_id: data.member_id,
              month,
              year,
              amount_due: member?.monthly_fee || 0,
              due_date: new Date(year, month - 1, 5).toISOString().split("T")[0],
              status: "due",
            },
          ])
          .select()
          .single();

        if (createError) throw createError;
        monthlyPaymentId = newMonthlyPayment.id;
      }

      // Insert payment ledger entry
      const { error: ledgerError } = await supabase.from("payments_ledger").insert([
        {
          monthly_payment_id: monthlyPaymentId,
          member_id: data.member_id,
          amount: parseFloat(data.amount),
          payment_date: data.payment_date,
          payment_method: data.payment_method,
          reference: data.reference || null,
          notes: data.notes || null,
        },
      ]);

      if (ledgerError) throw ledgerError;

      toast.success("Transaction recorded successfully!");

      // Send receipt via WhatsApp
      const selectedMember = members.find(m => m.id === data.member_id);
      if (selectedMember) {
        const receiptMessage = `*PAYMENT RECEIPT*\n\nMember: ${selectedMember.name}\nAmount Paid: Rs. ${parseFloat(data.amount).toLocaleString()}\nPayment Date: ${data.payment_date}\nPayment Method: ${data.payment_method}\nReference: ${data.reference || 'N/A'}\n\nThank you for your payment!`;
        const whatsappUrl = `https://wa.me/${selectedMember.phone_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(receiptMessage)}`;
        window.open(whatsappUrl, '_blank');
      }

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error adding transaction:", error);
      toast.error(error.message || "Failed to record transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="text-2xl">Add Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="member_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Member *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {members.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name} (Rs. {member.monthly_fee.toLocaleString()})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (Rs.) *</FormLabel>
                        <FormControl>
                          <Input placeholder="5000" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="payment_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="payment_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="online">Online Payment</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference</FormLabel>
                        <FormControl>
                          <Input placeholder="Transaction ref" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Additional notes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Recording...
                      </>
                    ) : (
                      "Record Transaction"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddTransaction;
