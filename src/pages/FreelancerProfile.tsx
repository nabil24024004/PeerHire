import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { EditProfileModal } from "@/components/EditProfileModal";
import { AvatarUpload } from "@/components/AvatarUpload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Edit,
  Briefcase,
  CheckCircle,
  Star,
  Calendar,
  FileText,
  Users,
  Clock,
  Award,
  Loader2,
  MessageSquare
} from "lucide-react";
import { TakaIcon } from "@/components/icons/TakaIcon";

const FreelancerProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Determine if viewing own profile or someone else's
  const isOwnProfile = !userId || (user && userId === user.id);
  const profileId = userId || user?.id;

  useEffect(() => {
    const checkRole = async () => {
      if (!authLoading && !user) {
        navigate("/login");
        return;
      }

      // Only redirect to hirer profile if viewing own profile and active role is hirer
      if (!authLoading && user && isOwnProfile) {
        const activeRole = localStorage.getItem('activeRole');
        if (activeRole === 'hirer') {
          navigate("/hirer/profile");
        }
      }
    };

    checkRole();
  }, [user, authLoading, navigate, isOwnProfile]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!profileId) return;

      setLoading(true);
      try {
        // Fetch base profile (all freelancer data is in profiles table now)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single();

        if (profileError) throw profileError;

        // Fetch completed jobs count
        const { count: completedJobsCount } = await supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .match({ freelancer_id: profileId, status: 'completed' });

        // Fetch current jobs count (assigned or in_progress)
        const { count: assignedCount } = await supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .match({ freelancer_id: profileId, status: 'assigned' });

        const { count: inProgressCount } = await supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .match({ freelancer_id: profileId, status: 'in_progress' });

        const currentJobsCount = (assignedCount || 0) + (inProgressCount || 0);

        // Fetch reviews (simple query to avoid TypeScript issues with joins)
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('id, rating, comment, created_at, reviewer_id, job_id')
          .eq('reviewee_id', profileId)
          .order('created_at', { ascending: false })
          .limit(10);

        // Format reviews with separate lookups for names
        const formattedReviews = await Promise.all(
          (reviewsData || []).map(async (r) => {
            const { data: reviewer } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', r.reviewer_id)
              .single();

            const { data: job } = await supabase
              .from('jobs')
              .select('title')
              .eq('id', r.job_id)
              .single();

            return {
              id: r.id,
              hirer_name: reviewer?.full_name || 'Anonymous',
              task_title: job?.title || 'Unknown Task',
              rating: r.rating,
              comment: r.comment,
              date: new Date(r.created_at).toLocaleDateString()
            };
          })
        );

        // Calculate average rating
        const avgRating = reviewsData && reviewsData.length > 0
          ? reviewsData.reduce((acc, r) => acc + r.rating, 0) / reviewsData.length
          : 0;

        // Format the profile data (all data comes from profiles table now)
        const formattedProfile = {
          ...profileData,
          completed_jobs: completedJobsCount || 0,
          current_jobs: currentJobsCount || 0,
          avg_rating: avgRating,
          total_earnings: profileData.total_earnings || 0,
          member_since: new Date(profileData.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          skills: profileData.skills || [],
          hourly_rate: profileData.hourly_rate || 0,
          handwriting_style: profileData.handwriting_sample_url ? 'Uploaded' : 'None',
          portfolio: [], // TODO: Fetch portfolio items
          reviews: formattedReviews,
          repeat_hirers: 0, // TODO: Calculate from conversations/jobs
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

    if (profileId) {
      fetchProfileData();
    }
  }, [profileId, toast]);

  if (authLoading || loading || !user || !profile) {
    return (
      <DashboardLayout role="freelancer">
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const handleSaveProfile = async (data: any) => {
    try {
      // Update profile - all freelancer data is now in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          student_id: data.student_id,
          bio: data.bio,
          skills: data.skills,
          hourly_rate: data.hourly_rate,
          portfolio_url: data.portfolio_url,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

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

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted"
              }`}
          />
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout role="freelancer">
      <div className="space-y-6">
        {/* Profile Header */}
        <Card className="p-6 bg-gradient-to-br from-green-900/30 to-card/80 backdrop-blur border border-white/10">
          <div className="flex items-start gap-6 flex-col md:flex-row">
            {isOwnProfile ? (
              <AvatarUpload
                userId={profileId || ''}
                currentAvatarUrl={profile.avatar_url}
                fullName={profile.full_name}
                size="xl"
                onAvatarChange={(url) => setProfile({ ...profile, avatar_url: url })}
              />
            ) : (
              <div className="h-32 w-32 rounded-full bg-green-500/20 flex items-center justify-center overflow-hidden border-2 border-green-500/30">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-green-400">{getInitials(profile.full_name || 'U')}</span>
                )}
              </div>
            )}

            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-black mb-2">
                    <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      {profile.full_name}
                    </span>
                  </h1>
                  <div className="flex items-center gap-3 flex-wrap text-sm">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      Freelancer
                    </Badge>
                    <span className="text-muted-foreground">{profile.department}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">Year {profile.year_of_study}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Member since {profile.member_since}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {renderStars(profile.avg_rating)}
                    <span className="text-sm font-medium text-foreground">{profile.avg_rating}</span>
                    <span className="text-sm text-muted-foreground">({profile.reviews.length} reviews)</span>
                  </div>
                </div>
                {isOwnProfile ? (
                  <Button onClick={() => setEditModalOpen(true)} className="btn-glow">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <Button onClick={() => navigate(`/hirer/messages?chat=${profileId}`)} className="btn-glow">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                )}
              </div>

              {profile.bio && (
                <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="bg-primary/5">
                    {skill}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Handwriting: </span>
                  <span className="text-foreground font-medium">{profile.handwriting_style}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Rate: </span>
                  <span className="text-foreground font-medium">৳{profile.hourly_rate}/work</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Completed Jobs"
            value={profile.completed_jobs}
            icon={CheckCircle}
            description="Successfully delivered"
          />
          <StatCard
            title="Current Jobs"
            value={profile.current_jobs}
            icon={Briefcase}
            description="In progress"
          />
          <StatCard
            title="Total Earned"
            value={`৳${profile.total_earnings.toLocaleString()}`}
            icon={TakaIcon}
            description="Lifetime earnings"
          />
          <StatCard
            title="Repeat Hirers"
            value={profile.repeat_hirers}
            icon={Users}
            description="Clients who came back"
          />
        </div>

        {/* Portfolio / Featured Work */}
        <Card className="p-6 border-border bg-card animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Portfolio</h2>
            </div>
            <Badge variant="outline" className="bg-primary/5">
              {profile.portfolio.filter(p => p.featured).length} Featured
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.portfolio.map((work, index) => (
              <Card
                key={work.id}
                className="p-4 border-border bg-background hover:bg-card transition-colors"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{work.title}</h3>
                      {work.featured && (
                        <Badge className="bg-primary/20 text-primary text-xs">Featured</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Badge variant="outline" className="text-xs">{work.type}</Badge>
                      <span>{work.subject}</span>
                      <span>•</span>
                      <span>{work.pages} pages</span>
                    </div>
                  </div>
                  {renderStars(work.rating)}
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Reviews */}
        <Card className="p-6 border-border bg-card animate-fade-in-up">
          <div className="flex items-center gap-2 mb-6">
            <Star className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Reviews</h2>
            <Badge variant="outline" className="ml-2">{profile.reviews.length} total</Badge>
          </div>
          <div className="space-y-4">
            {profile.reviews.map((review, index) => (
              <Card
                key={review.id}
                className="p-4 border-border bg-background"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">{review.hirer_name}</span>
                      <span className="text-muted-foreground text-sm">for</span>
                      <span className="text-sm text-muted-foreground">{review.task_title}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {renderStars(review.rating)}
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {review.date}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground italic">"{review.comment}"</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>

      <EditProfileModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        initialData={{
          full_name: profile.full_name || '',
          bio: profile.bio || '',
          skills: profile.skills || [],
          hourly_rate: profile.hourly_rate || 0,
          portfolio_url: profile.portfolio_url || '',
          student_id: profile.student_id || '',
        }}
        role="freelancer"
        onSave={handleSaveProfile}
      />

    </DashboardLayout>
  );
};

export default FreelancerProfile;
