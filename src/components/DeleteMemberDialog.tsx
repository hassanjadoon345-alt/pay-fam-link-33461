import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface DeleteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberName: string;
}

const DeleteMemberDialog = ({ open, onOpenChange, memberId, memberName }: DeleteMemberDialogProps) => {
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Delete in correct order to respect foreign key constraints
      // 1. Delete payments_ledger entries
      const { error: ledgerError } = await supabase
        .from("payments_ledger")
        .delete()
        .eq("member_id", memberId);

      if (ledgerError) throw ledgerError;

      // 2. Delete monthly_payments entries
      const { error: paymentsError } = await supabase
        .from("monthly_payments")
        .delete()
        .eq("member_id", memberId);

      if (paymentsError) throw paymentsError;

      // 3. Delete message_logs entries
      const { error: messagesError } = await supabase
        .from("message_logs")
        .delete()
        .eq("member_id", memberId);

      if (messagesError) throw messagesError;

      // 4. Finally delete the member
      const { error: memberError } = await supabase
        .from("members")
        .delete()
        .eq("id", memberId);

      if (memberError) throw memberError;

      toast.success("ممبر کامیابی سے حذف کر دیا گیا");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error deleting member:", error);
      toast.error("ممبر حذف کرنے میں خرابی");
    } finally {
      setDeleting(false);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-right">تصدیق کریں</AlertDialogTitle>
          <AlertDialogDescription className="text-right text-base">
            کیا آپ واقعی <strong>{memberName}</strong> اور ان کی تمام معلومات کو حذف کرنا چاہتے ہیں؟
            <br />
            <span className="text-destructive text-sm mt-2 block">
              یہ عمل واپس نہیں کیا جا سکتا۔
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogCancel disabled={deleting}>منسوخ</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {deleting ? "حذف ہو رہا ہے..." : "حذف کریں"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteMemberDialog;
