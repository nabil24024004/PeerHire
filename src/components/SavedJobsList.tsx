import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { Loader2, Bookmark, Calendar, DollarSign, FileText, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface SavedJobsListProps {
    userId: string;
}

export function SavedJobsList({ userId }: SavedJobsListProps) {
    const { savedJobs, loading, unsaveJob } = useSavedJobs(userId);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleUnsave = async (jobId: string) => {
        const { success } = await unsaveJob(jobId);
        if (success) {
            toast({
                title: "Job removed",
                description: "Job removed from saved list",
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    if (savedJobs.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center p-12">
                    <Bookmark className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No saved jobs yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                        Start saving jobs you're interested in to apply later
                    </p>
                    <Button onClick={() => navigate("/freelancer/browse-jobs")}>
                        Browse Jobs
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {savedJobs.map((savedJob) => {
                const job = savedJob.jobs;
                if (!job) return null;

                return (
                    <Card key={savedJob.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="font-semibold text-lg line-clamp-2">{job.title}</h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleUnsave(job.id)}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                                {job.description}
                            </p>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-semibold">${job.budget}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span>{job.page_count} pages</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                        Due{" "}
                                        {formatDistanceToNow(new Date(job.deadline), {
                                            addSuffix: true,
                                        })}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                                <Badge variant="secondary">{job.work_type}</Badge>
                                <Badge variant="outline">{job.quality_level}</Badge>
                            </div>

                            <Button
                                className="w-full"
                                onClick={() => navigate(`/freelancer/job/${job.id}`)}
                            >
                                View Details
                            </Button>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
