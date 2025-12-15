import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ProfileData {
  full_name: string;
  bio: string;
  skills?: string[];
  hourly_rate?: number;
  portfolio_url?: string;
  student_id?: string;
  availability?: string;
}

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: ProfileData;
  role: "hirer" | "freelancer";
  onSave: (data: ProfileData) => Promise<void>;
}

export const EditProfileModal = ({
  open,
  onOpenChange,
  initialData,
  role,
  onSave
}: EditProfileModalProps) => {
  const [formData, setFormData] = useState<ProfileData>(initialData);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave(formData);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Edit Profile</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update your {role} profile information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name || ""}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="bg-background border-border"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="student_id">Student ID (Optional)</Label>
              <Input
                id="student_id"
                value={formData.student_id || ""}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                className="bg-background border-border"
                placeholder="e.g., 24024004"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio || ""}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="bg-background border-border min-h-[100px]"
                placeholder="Tell others about yourself..."
              />
            </div>

            {role === "freelancer" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Hourly Rate (BDT)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    value={formData.hourly_rate || ""}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
                    className="bg-background border-border"
                    min="0"
                    step="10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portfolio_url">Portfolio URL (Optional)</Label>
                  <Input
                    id="portfolio_url"
                    type="url"
                    value={formData.portfolio_url || ""}
                    onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                    className="bg-background border-border"
                    placeholder="https://your-portfolio.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <Input
                    id="skills"
                    value={formData.skills?.join(", ") || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      skills: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                    })}
                    className="bg-background border-border"
                    placeholder="Assignments, Lab Reports, Math, Physics"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="btn-glow">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
