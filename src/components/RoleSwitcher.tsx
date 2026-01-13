import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Briefcase, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const RoleSwitcher = () => {
  const { role, hasMultipleRoles, switchRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!hasMultipleRoles) return null;

  const handleRoleSwitch = async (newRole: "freelancer" | "hirer") => {
    if (role === newRole) return;

    await switchRole(newRole);
    
    toast({
      title: "Role switched",
      description: `You are now in ${newRole} mode`,
    });

    // Navigate to appropriate dashboard
    navigate(`/${newRole}/dashboard`);
  };

  return (
    <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
      <Button
        variant={role === "hirer" ? "default" : "ghost"}
        size="sm"
        onClick={() => handleRoleSwitch("hirer")}
        className="gap-2"
      >
        <Briefcase className="w-4 h-4" />
        <span className="hidden sm:inline">Hirer</span>
      </Button>
      <Button
        variant={role === "freelancer" ? "default" : "ghost"}
        size="sm"
        onClick={() => handleRoleSwitch("freelancer")}
        className="gap-2"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Freelancer</span>
      </Button>
    </div>
  );
};
