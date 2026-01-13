import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Download,
  MessageSquare,
  User,
  Send,
  Loader2,
} from "lucide-react";
import { TakaIcon } from "@/components/icons/TakaIcon";

interface JobDetails {
  id: string;
  title: string;
  description: string;
  subject: string;
  work_type: string;
  page_count: number;
  budget: number;
  deadline: string;
  quality_level: string;
  status: string;
  attachment_urls: string[] | null;
  hirer: {
    full_name: string;
    email: string;
    id: string;
  };
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function FreelancerJobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<JobDetails | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const checkRoleAndFetch = async () => {
      if (!user) {
        navigate("/login");
        return;
      }

      // Check localStorage for active role
      const activeRole = localStorage.getItem('activeRole');
      if (activeRole === 'hirer') {
        navigate("/hirer/dashboard");
        return;
      }

      fetchJobDetails();
    };

    checkRoleAndFetch();
  }, [jobId, user, navigate]);

  const fetchJobDetails = async () => {
    try {
      // Fetch job data
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (jobError) throw jobError;

      // Fetch hirer profile separately
      const { data: hirerData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", jobData.hirer_id)
        .single();

      setJob({
        id: jobData.id,
        title: jobData.title,
        description: jobData.description || "",
        subject: jobData.category || "",
        work_type: jobData.required_skills?.[0] || "General",
        page_count: 1,
        budget: jobData.budget,
        deadline: jobData.deadline || new Date().toISOString(),
        quality_level: "standard",
        status: jobData.status,
        attachment_urls: jobData.attachment_urls,
        hirer: {
          full_name: hirerData?.full_name || "Unknown",
          email: hirerData?.email || "",
          id: jobData.hirer_id,
        },
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load job details",
        variant: "destructive",
      });
      navigate("/freelancer/jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleAskAI = async () => {
    if (!userInput.trim() || !job) return;

    const userMessage: ChatMessage = { role: "user", content: userInput };
    setChatMessages((prev) => [...prev, userMessage]);
    setUserInput("");
    setIsAiLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("job-helper", {
        body: {
          messages: [...chatMessages, userMessage],
          jobContext: {
            title: job.title,
            description: job.description,
            workType: job.work_type,
            subject: job.subject,
            pageCount: job.page_count,
            qualityLevel: job.quality_level,
          },
        },
      });

      if (error) {
        if (error.message?.includes("429")) {
          throw new Error("Rate limit exceeded. Please try again in a moment.");
        }
        if (error.message?.includes("402")) {
          throw new Error("AI service requires credits. Please contact support.");
        }
        throw error;
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.response,
      };
      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      toast({
        title: "AI Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const downloadFile = async (url: string) => {
    try {
      const fileName = url.split("/").pop() || "download";

      // Check if it's a full URL or just a path
      let filePath = url;
      if (url.includes("supabase.co/storage") || url.includes("/object/public/")) {
        // Extract the path after 'job-attachments/'
        const match = url.match(/job-attachments\/(.+)$/);
        if (match) {
          filePath = match[1];
        }
      }

      const { data, error } = await supabase.storage
        .from("job-attachments")
        .download(filePath);

      if (error) throw error;

      const downloadUrl = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: error.message || "Could not download file",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="freelancer">
        <div className="space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!job) return null;

  return (
    <DashboardLayout role="freelancer">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/freelancer/jobs")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{job.title}</h1>
            <p className="text-muted-foreground">Job Requirements & Details</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Details */}
            <Card>
              <CardHeader>
                <CardTitle>Job Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {job.description}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm">
                      <span className="text-muted-foreground">Type:</span>{" "}
                      {job.work_type}
                    </span>
                  </div>
                  {job.subject && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-sm">
                        <span className="text-muted-foreground">Subject:</span>{" "}
                        {job.subject}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm">
                      <span className="text-muted-foreground">Pages:</span>{" "}
                      {job.page_count}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TakaIcon className="w-4 h-4 text-success" />
                    <span className="text-sm font-semibold text-success">
                      ৳{job.budget}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-warning" />
                    <span className="text-sm">
                      <span className="text-muted-foreground">Due:</span>{" "}
                      {new Date(job.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{job.quality_level}</Badge>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <button
                    onClick={() => navigate(`/hirer/profile/${job.hirer.id}`)}
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>
                      Posted by <strong>{job.hirer.full_name}</strong>
                    </span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            {job.attachment_urls && job.attachment_urls.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Attached Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {job.attachment_urls.map((url, index) => {
                      const fileName = url.split("/").pop() || `File ${index + 1}`;
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-primary" />
                            <span className="text-sm">{fileName}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => downloadFile(url)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* AI Helper Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  AI Job Helper
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Get instant help and guidance
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Ask anything about this job!</p>
                      <p className="text-xs mt-2">
                        Examples: "What format should I use?" or "How do I cite
                        sources?"
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg ${msg.role === "user"
                          ? "bg-primary text-primary-foreground ml-8"
                          : "bg-muted mr-8"
                          }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ))
                  )}
                  {isAiLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AI is thinking...</span>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <Textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Ask the AI for help..."
                    className="resize-none"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAskAI();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    onClick={handleAskAI}
                    disabled={!userInput.trim() || isAiLoading}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
