import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { EditProfileModal } from "@/components/EditProfileModal";
import { AvatarUpload } from "@/components/AvatarUpload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  Image as ImageIcon,
  Users,
  Clock,
  Award,
  Loader2
} from "lucide-react";

import handwritingSample1 from "@/assets/handwriting-sample-1.jpg";
import handwritingSample2 from "@/assets/handwriting-sample-2.jpg";

const FreelancerProfile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const checkRole = async () => {
      if (!authLoading && !user) {
        navigate("/login");
        return;
      }

      if (!authLoading && user) {
        // Check localStorage for active role
        const activeRole = localStorage.getItem('activeRole');
        if (activeRole === 'hirer') {
          navigate("/hirer/profile");
        }
      }
    };

    checkRole();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Fetch base profile (all freelancer data is in profiles table now)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // Fetch completed jobs count
        const { count: completedJobsCount } = await supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .eq('freelancer_id', user.id)
          .eq('status', 'completed');

        // Fetch current jobs count (assigned or in_progress)
        const { count: currentJobsCount } = await supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .eq('freelancer_id', user.id)
          .or('status.eq.assigned,status.eq.in_progress');

        // Fetch reviews (simple query to avoid TypeScript issues with joins)
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('id, rating, comment, created_at, reviewer_id, job_id')
          .eq('reviewee_id', user.id)
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
          handwriting_samples: [handwritingSample1, handwritingSample2], // TODO: Fetch from storage
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

    if (user) {
      fetchProfileData();
    }
  }, [user, toast]);

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
                  <h1 className="text-4xl font-bold text-foreground mb-2">{profile.full_name}</h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge className="bg-success/20 text-success border-success/30 hover:bg-success/30">
                      Freelancer
                    </Badge>
                    <span className="text-muted-foreground">{profile.department}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">Year {profile.year_of_study}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Member since {profile.member_since}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {renderStars(profile.avg_rating)}
                    <span className="text-sm font-medium text-foreground">{profile.avg_rating}</span>
                    <span className="text-sm text-muted-foreground">({profile.reviews.length} reviews)</span>
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
                  <span className="text-foreground font-medium">৳{profile.hourly_rate}/hr</span>
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
            icon={DollarSign}
            description="Lifetime earnings"
          />
          <StatCard
            title="Repeat Hirers"
            value={profile.repeat_hirers}
            icon={Users}
            description="Clients who came back"
          />
        </div>

        {/* Handwriting Samples */}
        <Card className="p-6 border-border bg-card animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Handwriting Samples</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {profile.handwriting_samples.map((sample, index) => (
              <div
                key={index}
                className="aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors cursor-pointer group"
                onClick={() => setSelectedImage(sample)}
              >
                <img
                  src={sample}
                  alt={`Handwriting sample ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </Card>

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

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl bg-card border-border p-2">
          <img
            src={selectedImage || ""}
            alt="Handwriting sample"
            className="w-full h-auto rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default FreelancerProfile;
