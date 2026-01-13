import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Eye, MessageSquare, FileText, Calendar, DollarSign, CheckCircle, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type JobStatus = "open" | "assigned" | "in_progress" | "submitted" | "completed" | "cancelled";

interface Task {
  id: string;
  title: string;
  description: string;
  category: string | null;
  budget: number;
  deadline: string | null;
  status: string;
  created_at: string;
  applications_count?: number;
  freelancer_id?: string;
  freelancer_name?: string;
}

export default function HirerTasks() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast: toastHook } = useToast();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || role !== "hirer")) {
      navigate("/");
    }
  }, [user, role, authLoading, navigate]);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;

      try {
        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs")
          .select("*")
          .eq("hirer_id", user.id)
          .order("created_at", { ascending: false });

        if (jobsError) throw jobsError;

        // Fetch application counts and freelancer names for each job
        const tasksWithCounts = await Promise.all(
          (jobsData || []).map(async (job) => {
            const { count } = await supabase
              .from("applications")
              .select("*", { count: "exact", head: true })
              .eq("job_id", job.id);

            let freelancerName = null;
            // Get accepted application's freelancer for this job
            const { data: acceptedApp } = await supabase
              .from("applications")
              .select("freelancer_id")
              .eq("job_id", job.id)
              .eq("status", "accepted")
              .maybeSingle();

            if (acceptedApp?.freelancer_id) {
              const { data: profileData } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", acceptedApp.freelancer_id)
                .single();

              freelancerName = profileData?.full_name || null;
            }

            return {
              id: job.id,
              title: job.title,
              description: job.description,
              category: job.category,
              budget: job.budget,
              deadline: job.deadline,
              status: job.status,
              created_at: job.created_at,
              applications_count: count || 0,
              freelancer_id: acceptedApp?.freelancer_id || undefined,
              freelancer_name: freelancerName,
            };
          })
        );

        setTasks(tasksWithCounts);
        setFilteredTasks(tasksWithCounts);
      } catch (error: any) {
        toastHook({
          title: "Error",
          description: "Failed to load tasks",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user, toastHook]);

  useEffect(() => {
    let filtered = tasks;

    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter((task) => task.status === activeTab);
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTasks(filtered);
  }, [tasks, activeTab, searchQuery]);

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case "open":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "assigned":
      case "in_progress":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "submitted":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50";
      case "completed":
        return "bg-success/20 text-success border-success/50";
      case "cancelled":
        return "bg-destructive/20 text-destructive border-destructive/50";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusLabel = (status: JobStatus) => {
    return status.replace("_", " ").toUpperCase();
  };

  const handleMarkAsDone = async (task: Task) => {
    try {
      // Update job status to completed
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'completed' })
        .eq('id', task.id);

      if (error) throw error;

      // Open review modal
      setSelectedTask(task);
      setReviewModalOpen(true);

      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(t => t.id === task.id ? { ...t, status: 'completed' as JobStatus } : t)
      );

      toast.success("Task marked as done!");
    } catch (error) {
      console.error('Error marking task as done:', error);
      toast.error("Failed to mark task as done");
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedTask || rating === 0) {
      toast.error("Please provide a rating");
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          job_id: selectedTask.id,
          reviewer_id: user?.id,
          reviewee_id: selectedTask.freelancer_id,
          rating,
          comment: reviewComment || null,
        });

      if (error) throw error;

      toast.success("Review submitted successfully!");
      setReviewModalOpen(false);
      setRating(0);
      setReviewComment("");
      setSelectedTask(null);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error("Failed to submit review");
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout role="hirer">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="hirer">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-br from-purple-900/30 to-card/80 backdrop-blur border border-white/10">
          <div>
            <h1 className="text-2xl md:text-3xl font-black">
              My{" "}
              <span className="bg-gradient-to-r from-purple-400 via-primary to-violet-400 bg-clip-text text-transparent">
                Tasks
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage and track all your posted tasks</p>
          </div>
          <Button
            className="bg-gradient-to-r from-purple-600 to-primary hover:from-purple-700 hover:to-primary/90 shadow-lg shadow-primary/25 border-0 font-bold"
            onClick={() => navigate("/hirer/dashboard")}
          >
            Post New Task
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or subject..."
            className="pl-11 bg-card/60 border-white/10 focus:border-primary/30"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full overflow-x-auto gap-1 h-auto p-1 bg-card/60 border border-white/5">
            <TabsTrigger value="all" className="flex-shrink-0 px-4 py-2 text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">All</TabsTrigger>
            <TabsTrigger value="open" className="flex-shrink-0 px-4 py-2 text-xs data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">Open</TabsTrigger>
            <TabsTrigger value="in_progress" className="flex-shrink-0 px-4 py-2 text-xs data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">In Progress</TabsTrigger>
            <TabsTrigger value="completed" className="flex-shrink-0 px-4 py-2 text-xs data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">Completed</TabsTrigger>
            <TabsTrigger value="submitted" className="flex-shrink-0 px-4 py-2 text-xs data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">Submitted</TabsTrigger>
            <TabsTrigger value="cancelled" className="flex-shrink-0 px-4 py-2 text-xs data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredTasks.length === 0 ? (
              <Card className="bg-card/60 backdrop-blur border-white/5">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "No tasks found matching your search"
                      : activeTab === "all"
                        ? "You haven't posted any tasks yet"
                        : `No ${activeTab.replace("_", " ")} tasks`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <Card key={task.id} className="p-4 bg-card/60 backdrop-blur border-white/5 hover:border-primary/20 transition-all duration-300 group">
                    <div className="flex flex-col gap-4">
                      {/* Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-primary/20 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">{task.title}</h3>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span>{task.category || 'General'}</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                              </span>
                              <span className="text-primary font-semibold">৳{task.budget}</span>
                            </div>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(task.status as JobStatus)} flex-shrink-0`}>
                          {getStatusLabel(task.status as JobStatus)}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>

                      {/* Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        {task.status === "open" && task.applications_count !== undefined && (
                          <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                            {task.applications_count} {task.applications_count === 1 ? "offer" : "offers"}
                          </Badge>
                        )}

                        <div className="flex flex-wrap gap-2 ml-auto">
                          <Button
                            size="sm"
                            onClick={() => navigate(`/hirer/task/${task.id}/offers`)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          {(task.status === 'assigned' || task.status === 'in_progress' || task.status === 'submitted') && (
                            <Button
                              size="sm"
                              onClick={() => handleMarkAsDone(task)}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Done
                            </Button>
                          )}
                          {task.status === "in_progress" && task.freelancer_id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/messages?user=${task.freelancer_id}`)}
                              className="border-white/10"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate Freelancer</DialogTitle>
            <DialogDescription>
              How was your experience with this freelancer?
            </DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4 py-4">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">{selectedTask.title}</p>
                <p>Freelancer: {selectedTask.freelancer_name || 'N/A'}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Rating *</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-colors"
                    >
                      <Star
                        className={`h-8 w-8 ${star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                          }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Review (Optional)</label>
                <Textarea
                  placeholder="Share your experience with this freelancer..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setReviewModalOpen(false);
                    setRating(0);
                    setReviewComment("");
                    setSelectedTask(null);
                  }}
                  className="flex-1"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={rating === 0}
                  className="flex-1"
                >
                  Submit Review
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
