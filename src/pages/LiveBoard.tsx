import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Search, MessageSquare } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface FreelancerProfile {
  user_id: string;
  status: string;
  skills: string[] | null;
  hourly_rate: number | null;
  total_earnings: number | null;
  total_jobs_completed: number | null;
  profiles: {
    full_name: string;
    department: string;
    rating: number | null;
  };
}

const LiveBoard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFreelancers();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('freelancer_profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'freelancer_profiles'
        },
        () => {
          fetchFreelancers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFreelancers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('freelancer_profiles')
        .select(`
          user_id,
          status,
          skills,
          hourly_rate,
          total_earnings,
          total_jobs_completed,
          profiles!inner (
            full_name,
            department,
            rating
          )
        `)
        .order('total_jobs_completed', { ascending: false });

      if (error) throw error;
      setFreelancers(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading freelancers",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversation = async (freelancerId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Not authenticated",
          description: "Please log in to message freelancers",
          variant: "destructive",
        });
        return;
      }

      // Check if conversation already exists
      const { data: existingConvo } = await supabase
        .from('conversations')
        .select('id')
        .eq('hirer_id', session.user.id)
        .eq('freelancer_id', freelancerId)
        .maybeSingle();

      if (existingConvo) {
        navigate(`/hirer/messages?conversation=${existingConvo.id}`);
        return;
      }

      // Create new conversation
      const { data: newConvo, error } = await supabase
        .from('conversations')
        .insert({
          hirer_id: session.user.id,
          freelancer_id: freelancerId,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Conversation started",
        description: "You can now message this freelancer",
      });

      navigate(`/hirer/messages?conversation=${newConvo.id}`);
    } catch (error: any) {
      toast({
        title: "Error starting conversation",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "available":
        return (
          <Badge className="bg-success/20 text-success border-success">
            <div className="w-2 h-2 rounded-full bg-success mr-2" />
            Available
          </Badge>
        );
      case "busy":
        return (
          <Badge className="bg-destructive/20 text-destructive border-destructive">
            <div className="w-2 h-2 rounded-full bg-destructive mr-2" />
            Busy
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted/20 text-muted-foreground border-muted">
            <div className="w-2 h-2 rounded-full bg-muted-foreground mr-2" />
            Offline
          </Badge>
        );
    }
  };

  const filteredFreelancers = freelancers.filter((freelancer) => {
    const matchesSearch = 
      freelancer.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      freelancer.profiles.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      freelancer.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDept = departmentFilter === "all" || 
      freelancer.profiles.department.toLowerCase() === departmentFilter.toLowerCase();

    const matchesStatus = statusFilter === "all" || 
      freelancer.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <DashboardLayout role="hirer">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Live Freelancers Board</h1>
          <p className="text-sm md:text-base text-muted-foreground">Real-time availability • {filteredFreelancers.length} freelancers</p>
        </div>

        {/* Filters */}
        <Card className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by name, department, or skills..."
                className="pl-10 h-11 md:h-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="h-11 md:h-12">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="cse">CSE</SelectItem>
                <SelectItem value="eee">EEE</SelectItem>
                <SelectItem value="ave">AVE</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11 md:h-12">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-border">
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-muted-foreground">Available now</span>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-muted-foreground">Busy / Offline</span>
            </div>
          </div>
        </Card>

        {/* Freelancers Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-48 w-full" />
              </Card>
            ))}
          </div>
        ) : filteredFreelancers.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">No freelancers found matching your criteria.</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredFreelancers.map((freelancer) => (
              <Card key={freelancer.user_id} className="p-4 md:p-6 card-hover">
                {/* Header */}
                <div className="flex items-start gap-3 md:gap-4 mb-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center text-lg md:text-2xl font-bold">
                    {freelancer.profiles.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base md:text-lg mb-1 truncate">{freelancer.profiles.full_name}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">
                      {freelancer.profiles.department}
                    </p>
                    {getStatusBadge(freelancer.status)}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <span className="font-bold text-sm md:text-base">{freelancer.profiles.rating?.toFixed(1) || "New"}</span>
                  </div>
                  <span className="text-xs md:text-sm text-muted-foreground">
                    {freelancer.total_jobs_completed || 0} jobs
                  </span>
                </div>

                {/* Skills */}
                {freelancer.skills && freelancer.skills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs md:text-sm text-muted-foreground mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {freelancer.skills.slice(0, 3).map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {freelancer.skills.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{freelancer.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => handleStartConversation(freelancer.user_id)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button 
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/hirer/profile/${freelancer.user_id}`)}
                  >
                    View Profile
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LiveBoard;
