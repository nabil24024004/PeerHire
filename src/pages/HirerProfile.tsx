import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { EditProfileModal } from "@/components/EditProfileModal";
import { AvatarUpload } from "@/components/AvatarUpload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Edit,
  Briefcase,
  CheckCircle,
  DollarSign,
  Star,
  Calendar,
  FileText,
  Clock,
  Tag,
  Loader2
} from "lucide-react";

const HirerProfile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, role } = useAuth();
  const { toast } = useToast();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    } else if (!authLoading && role !== "hirer") {
      navigate("/freelancer/profile");
    }
  }, [user, authLoading, role, navigate]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Fetch base profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // Fetch total tasks count
        const { count: totalTasks } = await supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true })
          .eq('hirer_id', user.id);

        // Fetch completed tasks count
        const { count: completedTasks } = await supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true })
          .eq('hirer_id', user.id)
          .eq('status', 'completed');

        // Fetch recent tasks
        const { data: recentTasksData } = await supabase
          .from('jobs')
          .select('*')
          .eq('hirer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        // Calculate total spent (for now, sum of budgets for completed jobs)
        const { data: completedJobsData } = await supabase
          .from('jobs')
          .select('budget')
          .eq('hirer_id', user.id)
          .eq('status', 'completed');

        const totalSpent = completedJobsData?.reduce((sum, job) => sum + (job.budget || 0), 0) || 0;

        // Calculate average rating given (from reviews where user is reviewer)
        const { data: reviewsGiven } = await supabase
          .from('reviews')
          .select('rating')
          .eq('reviewer_id', user.id);

        const avgRatingGiven = reviewsGiven && reviewsGiven.length > 0
          ? reviewsGiven.reduce((acc, r) => acc + r.rating, 0) / reviewsGiven.length
          : 0;

        // Format the profile data
        const formattedProfile = {
          ...profileData,
          member_since: new Date(profileData.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          total_tasks: totalTasks || 0,
          completed_tasks: completedTasks || 0,
          total_spent: totalSpent,
          avg_rating_given: avgRatingGiven,
          recent_tasks: recentTasksData?.map(task => ({
            id: task.id,
            title: task.title,
            category: task.category || 'General',
            date: new Date(task.created_at).toLocaleDateString(),
            amount: task.budget,
            status: task.status
          })) || []
        };

        setProfile(formattedProfile);
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user && role === "hirer") {
      fetchProfileData();
    }
  }, [user, role, toast]);

  if (authLoading || loading || !user || !profile) {
    return (
      <DashboardLayout role="hirer">
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const handleSaveProfile = async (data: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          bio: data.bio,
          student_id: data.student_id,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setProfile({ ...profile, ...data });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      throw error;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success/20 text-success border-success/30";
      case "in_progress": return "bg-primary/20 text-primary border-primary/30";
      case "open": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "cancelled": return "bg-destructive/20 text-destructive border-destructive/30";
      default: return "bg-muted/20 text-muted-foreground border-muted/30";
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  return (
    <DashboardLayout role="hirer">
      <div className="space-y-8">
        {/* Profile Header */}
        <Card className="p-8 border-border bg-card animate-fade-in-up">
          <div className="flex items-start gap-6 flex-col md:flex-row">
            <AvatarUpload
              userId={user.id}
              currentAvatarUrl={profile.avatar_url}
              fullName={profile.full_name}
              size="xl"
              onAvatarChange={(url) => setProfile({ ...profile, avatar_url: url })}
            />

            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-2">{profile.full_name || "Unnamed"}</h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">
                      Hirer
                    </Badge>
                    {profile.student_id && (
                      <span className="text-muted-foreground">ID: {profile.student_id}</span>
                    )}
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Member since {profile.member_since}
                    </span>
                  </div>
                </div>
                <Button onClick={() => setEditModalOpen(true)} className="btn-glow">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>

              {profile.bio && (
                <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Tasks"
            value={profile.total_tasks}
            icon={Briefcase}
            description="Tasks you've posted"
          />
          <StatCard
            title="Completed"
            value={profile.completed_tasks}
            icon={CheckCircle}
            description={`${profile.total_tasks > 0 ? Math.round((profile.completed_tasks / profile.total_tasks) * 100) : 0}% completion rate`}
          />
          <StatCard
            title="Total Spent"
            value={`৳${profile.total_spent.toLocaleString()}`}
            icon={DollarSign}
            description="Across all tasks"
          />
          <StatCard
            title="Avg Rating Given"
            value={profile.avg_rating_given.toFixed(1)}
            icon={Star}
            description="To freelancers"
          />
        </div>

        {/* Recent Tasks */}
        <Card className="p-6 border-border bg-card animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Recent Tasks</h2>
              <p className="text-sm text-muted-foreground">Your latest posted tasks</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/hirer/tasks")}>
              View All Tasks
            </Button>
          </div>

          <div className="space-y-4">
            {profile.recent_tasks.map((task, index) => (
              <Card
                key={task.id}
                className="p-4 border-border bg-background hover:bg-card transition-colors cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{task.title}</h3>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        {task.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {task.date}
                      </span>
                      <span className="flex items-center gap-1 text-primary font-medium">
                        <DollarSign className="h-4 w-4" />
                        ৳{task.amount}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Hiring Insights */}
        <Card className="p-6 border-border bg-card animate-fade-in-up">
          <h2 className="text-2xl font-bold text-foreground mb-4">Hiring Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Most Hired Categories</p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">Lab Reports (8)</Badge>
                <Badge variant="outline">Assignments (6)</Badge>
                <Badge variant="outline">Documentation (4)</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Preferred Budget Range</p>
              <p className="text-lg font-semibold text-foreground">৳500 - ৳1,500</p>
            </div>
          </div>
        </Card>
      </div>

      <EditProfileModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        initialData={{
          full_name: profile.full_name || "",
          bio: profile.bio || "",
          student_id: profile.student_id || "",
        }}
        role="hirer"
        onSave={handleSaveProfile}
      />
    </DashboardLayout>
  );
};

export default HirerProfile;
