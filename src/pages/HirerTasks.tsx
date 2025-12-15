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
  subject: string;
  work_type: string;
  page_count: number;
  budget: number;
  deadline: string;
  status: JobStatus;
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
              .from("job_applications")
              .select("*", { count: "exact", head: true })
              .eq("job_id", job.id);

            let freelancerName = null;
            if (job.freelancer_id) {
              const { data: profileData } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", job.freelancer_id)
                .single();
              
              freelancerName = profileData?.full_name || null;
            }

            return {
              ...job,
              applications_count: count || 0,
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
          task.subject?.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold gradient-text">My Tasks</h1>
          <Button onClick={() => navigate("/hirer/dashboard")}>
            Post New Task
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by title or subject..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full overflow-x-auto gap-1 h-auto p-1">
            <TabsTrigger value="all" className="flex-shrink-0 px-3 py-1.5 text-xs sm:text-sm">All</TabsTrigger>
            <TabsTrigger value="open" className="flex-shrink-0 px-3 py-1.5 text-xs sm:text-sm">Open</TabsTrigger>
            <TabsTrigger value="in_progress" className="flex-shrink-0 px-3 py-1.5 text-xs sm:text-sm">In Progress</TabsTrigger>
            <TabsTrigger value="completed" className="flex-shrink-0 px-3 py-1.5 text-xs sm:text-sm">Completed</TabsTrigger>
            <TabsTrigger value="submitted" className="flex-shrink-0 px-3 py-1.5 text-xs sm:text-sm">Submitted</TabsTrigger>
            <TabsTrigger value="cancelled" className="flex-shrink-0 px-3 py-1.5 text-xs sm:text-sm">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredTasks.length === 0 ? (
              <Card className="border-border">
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">
                    {searchQuery
                      ? "No tasks found matching your search"
                      : activeTab === "all"
                      ? "You haven't posted any tasks yet"
                      : `No ${activeTab.replace("_", " ")} tasks`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredTasks.map((task) => (
                  <Card key={task.id} className="card-hover border-border">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg sm:text-xl mb-2 break-words">{task.title}</CardTitle>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              {task.work_type}
                            </span>
                            {task.subject && (
                              <span>• {task.subject}</span>
                            )}
                            <span>• {task.page_count} pages</span>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(task.status)} flex-shrink-0 text-xs`}>
                          {getStatusLabel(task.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {task.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-1 text-primary">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold">{task.budget}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                        </div>
                        {task.status === "open" && task.applications_count !== undefined && (
                          <Badge variant="secondary">
                            {task.applications_count} {task.applications_count === 1 ? "offer" : "offers"}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => navigate(`/hirer/task/${task.id}/offers`)}
                          className="text-xs sm:text-sm"
                        >
                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                          View Details
                        </Button>
                        {(task.status === 'assigned' || task.status === 'in_progress' || task.status === 'submitted') && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleMarkAsDone(task)}
                            className="bg-success hover:bg-success/90 text-xs sm:text-sm"
                          >
                            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                            Mark as Done
                          </Button>
                        )}
                        {task.status === "open" && task.applications_count && task.applications_count > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/hirer/task/${task.id}/offers`)}
                            className="text-xs sm:text-sm"
                          >
                            View Offers
                          </Button>
                        )}
                        {task.status === "in_progress" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/messages")}
                            className="text-xs sm:text-sm"
                          >
                            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                            Open Chat
                          </Button>
                        )}
                      </div>
                    </CardContent>
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
                        className={`h-8 w-8 ${
                          star <= rating
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
