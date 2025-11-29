import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const applicationSchema = z.object({
  coverLetter: z.string().min(50, "Cover letter must be at least 50 characters"),
  proposedPrice: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Price must be a valid positive number",
  }),
});

interface JobApplicationModalProps {
  job: {
    id: string;
    title: string;
    budget: number;
    description: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function JobApplicationModal({
  job,
  isOpen,
  onClose,
  onSuccess,
}: JobApplicationModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof applicationSchema>>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      coverLetter: "",
      proposedPrice: job.budget.toString(),
    },
  });

  const onSubmit = async (values: z.infer<typeof applicationSchema>) => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: job.id,
          freelancer_id: session.user.id,
          cover_letter: values.coverLetter,
          proposed_price: Number(values.proposedPrice),
          status: 'pending',
        });

      if (error) throw error;

      onSuccess();
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error submitting application",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply to Job</DialogTitle>
          <DialogDescription>
            Submit your application for: <span className="font-semibold">{job.title}</span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Job Details Summary */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Job Details</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {job.description}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Budget:</span>{" "}
                <span className="font-semibold">${job.budget}</span>
              </p>
            </div>

            {/* Cover Letter */}
            <FormField
              control={form.control}
              name="coverLetter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Letter *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why you're the best fit for this job. Highlight your relevant experience and skills..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {field.value.length} / minimum 50 characters
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Proposed Price */}
            <FormField
              control={form.control}
              name="proposedPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Proposed Price ($) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter your price"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    You can propose a different price than the hirer's budget
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Application
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
