import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Search } from "lucide-react";

interface AddRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleToAdd: "hirer" | "freelancer";
}

export const AddRoleModal = ({ open, onOpenChange, roleToAdd }: AddRoleModalProps) => {
  const { addRole } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleAddRole = async () => {
    setLoading(true);
    const result = await addRole(roleToAdd);
    
    if (result.success) {
      toast({
        title: "Role added successfully",
        description: `You can now switch between Hirer and Freelancer modes`,
      });
      onOpenChange(false);
    } else {
      toast({
        title: "Failed to add role",
        description: "Please try again later",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const roleInfo = {
    hirer: {
      icon: Briefcase,
      title: "Enable Hirer Mode",
      description: "Start posting jobs and hiring freelancers for your assignments",
      features: ["Post unlimited jobs", "Browse freelancer profiles", "Track task progress", "Rate freelancers"]
    },
    freelancer: {
      icon: Search,
      title: "Enable Freelancer Mode",
      description: "Start taking jobs and earning money from your skills",
      features: ["Browse available jobs", "Build your profile", "Showcase your work", "Earn and get rated"]
    }
  };

  const info = roleInfo[roleToAdd];
  const Icon = info.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">{info.title}</DialogTitle>
          <DialogDescription className="text-center">
            {info.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <p className="text-sm font-medium">What you'll get:</p>
          <ul className="space-y-2">
            {info.features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddRole}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? "Adding..." : `Enable ${roleToAdd === "hirer" ? "Hirer" : "Freelancer"} Mode`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
