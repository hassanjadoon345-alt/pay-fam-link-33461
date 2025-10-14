import { useState } from "react";
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

const memberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  father_name: z.string().optional(),
  phone_number: z.string().regex(/^\+92\d{10}$/, "Phone must be in format: +92XXXXXXXXXX"),
  alternate_phone: z.string().regex(/^\+92\d{10}$/, "Phone must be in format: +92XXXXXXXXXX").optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  monthly_fee: z.string().min(1, "Monthly fee is required"),
  membership_type: z.string().min(1, "Membership type is required"),
  notes: z.string().max(1000).optional(),
});

type MemberFormData = z.infer<typeof memberSchema>;

const AddMember = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: "",
      father_name: "",
      phone_number: "+92",
      alternate_phone: "",
      email: "",
      address: "",
      monthly_fee: "",
      membership_type: "regular",
      notes: "",
    },
  });

  const onSubmit = async (data: MemberFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("members").insert([
        {
          name: data.name,
          father_name: data.father_name || null,
          phone_number: data.phone_number,
          alternate_phone: data.alternate_phone || null,
          email: data.email || null,
          address: data.address || null,
          monthly_fee: parseFloat(data.monthly_fee),
          membership_type: data.membership_type,
          notes: data.notes || null,
          active: true,
          user_id: null, // Members created by admin don't have user accounts initially
        },
      ]);

      if (error) throw error;

      toast.success("Member added successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error adding member:", error);
      toast.error(error.message || "Failed to add member");
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
            <CardTitle className="text-2xl">Add New Member</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Member name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="father_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Father Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Father's name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="+92XXXXXXXXXX" type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="alternate_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alternate Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+92XXXXXXXXXX" type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="member@example.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Full address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="monthly_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Fee (Rs.) *</FormLabel>
                        <FormControl>
                          <Input placeholder="5000" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="membership_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Membership Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="regular">Regular</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="basic">Basic</SelectItem>
                          </SelectContent>
                        </Select>
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
                        Adding...
                      </>
                    ) : (
                      "Add Member"
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

export default AddMember;
