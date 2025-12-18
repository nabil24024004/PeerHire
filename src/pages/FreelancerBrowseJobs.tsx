import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { JobApplicationModal } from "@/components/JobApplicationModal";
import {
  Search, Filter, Briefcase, Clock, DollarSign, FileText, User, MessageSquare, Bookmark, BookmarkCheck, Sparkles
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Job {
  id: string;
  title: string;
  description: string;
  category: string | null;
  budget: number;
  deadline: string;
  status: string;
  hirer_id: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
  hirer_name?: string;
}

const FreelancerBrowseJobs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkType, setSelectedWorkType] = useState<string>("all");
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
        return;
      }

      // Check localStorage for active role
      const activeRole = localStorage.getItem('activeRole');
      if (activeRole === 'hirer') {
        navigate("/hirer/dashboard");
        return;
      }

      await fetchJobs(session.user.id);
    };

    checkAuthAndFetch();
  }, [navigate]);

  const fetchJobs = async (userId: string) => {
    try {
      // Fetch all open jobs (excluding jobs posted by current user - prevent self-hiring)
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'open')
        .neq('hirer_id', userId)  // Don't show your own jobs
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      // Fetch hirer profiles for each job
      const jobsWithHirerNames = await Promise.all(
        (jobsData || []).map(async (job) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', job.hirer_id)
            .single();

          return {
            ...job,
            hirer_name: profileData?.full_name || 'Unknown',
          };
        })
      );

      // Fetch user's applications (correct table name)
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select('job_id')
        .eq('freelancer_id', userId);

      if (applicationsError) throw applicationsError;

      const appliedIds = new Set(applicationsData?.map(app => app.job_id) || []);
      setAppliedJobIds(appliedIds);

      // Saved jobs stored locally (no saved_jobs table)
      const savedIdsStr = localStorage.getItem('savedJobIds') || '[]';
      const savedIds = new Set<string>(JSON.parse(savedIdsStr));
      setSavedJobIds(savedIds);

      // Get saved jobs list
      const savedJobsList = jobsWithHirerNames?.filter(job => savedIds.has(job.id)) || [];
      setSavedJobs(savedJobsList);

      // Filter out jobs already applied to
      const availableJobs = jobsWithHirerNames?.filter(job => !appliedIds.has(job.id)) || [];
      setJobs(availableJobs);
      setFilteredJobs(availableJobs);

      // Fetch recommendations (may fail silently)
      await fetchRecommendations(userId);

      setIsLoading(false);
    } catch (error: any) {
      toast({
        title: "Error loading jobs",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const fetchRecommendations = async (userId: string) => {
    setIsLoadingRecommendations(true);
    try {
      const { data, error } = await supabase.functions.invoke('recommend-jobs', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      setRecommendedJobs(data.recommendations || []);
    } catch (error: any) {
      console.error("Error fetching recommendations:", error);
      // Silently fail for recommendations
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const handleSaveJob = async (jobId: string) => {
    const isSaved = savedJobIds.has(jobId);

    if (isSaved) {
      // Unsave from localStorage
      setSavedJobIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        localStorage.setItem('savedJobIds', JSON.stringify([...newSet]));
        return newSet;
      });
      setSavedJobs(prev => prev.filter(job => job.id !== jobId));
      toast({ title: "Job unsaved" });
    } else {
      // Save to localStorage
      setSavedJobIds(prev => {
        const newSet = new Set([...prev, jobId]);
        localStorage.setItem('savedJobIds', JSON.stringify([...newSet]));
        return newSet;
      });
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        setSavedJobs(prev => [...prev, job]);
      }
      toast({ title: "Job saved for later" });
    }
  };

  useEffect(() => {
    let filtered = jobs;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedWorkType !== "all") {
      filtered = filtered.filter(job => job.category === selectedWorkType);
    }

    setFilteredJobs(filtered);
  }, [searchQuery, selectedWorkType, jobs, activeTab]);

  const handleApplyClick = (job: Job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const renderJobCard = (job: Job, isRecommended = false) => (
    <Card key={job.id} className={`p-4 md:p-6 card-hover ${isRecommended ? 'border-primary/30' : ''}`}>
      <div className="space-y-3 md:space-y-4">
        {/* Job Header */}
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="flex-1">
            <div className="flex items-start gap-2 md:gap-3 mb-2">
              <h3 className="text-base md:text-xl font-bold flex-1 break-words">{job.title}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSaveJob(job.id)}
                className={`flex-shrink-0 ${savedJobIds.has(job.id) ? "text-primary" : ""}`}
              >
                {savedJobIds.has(job.id) ? (
                  <BookmarkCheck className="w-5 h-5" />
                ) : (
                  <Bookmark className="w-5 h-5" />
                )}
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {isRecommended && (
                <Badge className="bg-primary text-primary-foreground text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Recommended
                </Badge>
              )}
              {job.category && (
                <Badge variant="outline" className="text-xs">{job.category}</Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => handleMessageHirer(job)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Message
            </Button>
            <Button
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => handleApplyClick(job)}
            >
              Apply Now
            </Button>
          </div>
        </div>

        {/* Job Description */}
        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
          {job.description}
        </p>

        {/* Job Details */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 pt-3 md:pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <DollarSign className="w-4 h-4 text-success flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-muted-foreground">Budget</p>
              <p className="font-semibold truncate">{job.budget}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <FileText className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-muted-foreground">Category</p>
              <p className="font-semibold">{job.category || 'General'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <Clock className="w-4 h-4 text-warning flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-muted-foreground">Deadline</p>
              <p className="font-semibold truncate">
                {new Date(job.deadline).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-muted-foreground">Posted by</p>
              <p className="font-semibold truncate">
                {job.profiles?.full_name || "Unknown"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  const handleApplicationSuccess = (jobId: string) => {
    setAppliedJobIds(prev => new Set([...prev, jobId]));
    setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
    setFilteredJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
    setIsModalOpen(false);
    toast({
      title: "Application submitted",
      description: "Your application has been sent to the hirer.",
    });
  };

  const handleMessageHirer = async (job: Job) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // Navigate to messages with hirer ID as chat param
      navigate(`/freelancer/messages?chat=${job.hirer_id}`);
    } catch (error: any) {
      toast({
        title: "Error opening chat",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="freelancer">
        <div className="space-y-6">
          <Skeleton className="h-16 w-full" />
          <div className="grid gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="freelancer">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Find Work</h1>
          <p className="text-sm md:text-base text-muted-foreground">Browse and apply to available jobs</p>
        </div>

        {/* Search and Filters */}
        <Card className="p-4">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={selectedWorkType} onValueChange={setSelectedWorkType}>
              <SelectTrigger className="w-full h-11">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Work Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Assignment">Assignment</SelectItem>
                <SelectItem value="Lab Report">Lab Report</SelectItem>
                <SelectItem value="Presentation">Presentation</SelectItem>
                <SelectItem value="Research Paper">Research Paper</SelectItem>
                <SelectItem value="Essay">Essay</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="all" className="text-xs md:text-sm">
              <span className="hidden sm:inline">All Jobs</span>
              <span className="sm:hidden">All</span>
              <Badge variant="secondary" className="ml-1 md:ml-2 text-xs">{jobs.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="recommended" className="text-xs md:text-sm">
              <Sparkles className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Recommended</span>
              <Badge variant="secondary" className="ml-1 md:ml-2 text-xs">{recommendedJobs.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="saved" className="text-xs md:text-sm">
              <Bookmark className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Saved</span>
              <Badge variant="secondary" className="ml-1 md:ml-2 text-xs">{savedJobs.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* All Jobs Tab */}
          <TabsContent value="all" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} available
              </p>
            </div>

            {filteredJobs.length === 0 ? (
              <Card className="p-12 text-center">
                <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-bold mb-2">No jobs found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || selectedWorkType !== "all"
                    ? "Try adjusting your search or filters"
                    : "Check back later for new opportunities"}
                </p>
              </Card>
            ) : (
              <div className="grid gap-6">
                {filteredJobs.map((job) => renderJobCard(job))}
              </div>
            )}
          </TabsContent>

          {/* Recommended Tab */}
          <TabsContent value="recommended" className="mt-6">
            {isLoadingRecommendations ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
              </div>
            ) : recommendedJobs.length === 0 ? (
              <Card className="p-12 text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-bold mb-2">No recommendations yet</h3>
                <p className="text-muted-foreground">
                  Complete your profile and apply to jobs to get personalized recommendations
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">AI-Powered Recommendations</h3>
                      <p className="text-sm text-muted-foreground">
                        These jobs match your skills, experience, and application history
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-6">
                  {recommendedJobs.map((job) => renderJobCard(job, true))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Saved Tab */}
          <TabsContent value="saved" className="mt-6">
            {savedJobs.length === 0 ? (
              <Card className="p-12 text-center">
                <Bookmark className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-bold mb-2">No saved jobs</h3>
                <p className="text-muted-foreground">
                  Bookmark jobs you're interested in to review and apply later
                </p>
              </Card>
            ) : (
              <div className="grid gap-6">
                {savedJobs.map((job) => renderJobCard(job))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Application Modal */}
      {selectedJob && (
        <JobApplicationModal
          job={selectedJob}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => handleApplicationSuccess(selectedJob.id)}
        />
      )}
    </DashboardLayout>
  );
};

export default FreelancerBrowseJobs;
