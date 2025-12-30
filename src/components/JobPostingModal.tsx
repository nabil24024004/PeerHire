import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";

interface JobPostingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WORK_TYPES = [
  "Assignment Writing",
  "Lab Report",
  "Project Documentation",
  "Presentation",
  "Proofreading",
  "Other"
];

const SUBJECTS = [
  "Math", "Thermodynamics", "Mechanics", "Physics", "Chemistry",
  "Aerodynamics", "AVE", "Sociology", "Others"
];

const QUALITY_LEVELS = [
  { value: "standard", label: "Standard", multiplier: 1 },
  { value: "premium", label: "Premium", multiplier: 1.5 },
  { value: "urgent", label: "Urgent (24h)", multiplier: 2 }
];

export function JobPostingModal({ open, onOpenChange }: JobPostingModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState("");
  const [workType, setWorkType] = useState("");
  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [pageCount, setPageCount] = useState(1);
  const [qualityLevel, setQualityLevel] = useState("standard");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");

  const BASE_PRICE_PER_PAGE = 10;

  // Helper to get the effective subject (custom if Others is selected)
  const getEffectiveSubject = () => subject === "Others" ? customSubject : subject;

  // Calculate deadline multiplier based on time until deadline
  const getDeadlineMultiplier = () => {
    if (!deadline) return 1;

    const now = new Date();
    const deadlineDate = new Date(deadline);
    const hoursUntilDeadline = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDeadline <= 0) return 1.5; // Past deadline, max urgency
    if (hoursUntilDeadline <= 24) return 1.5; // Less than 24 hours (+50%)
    if (hoursUntilDeadline <= 48) return 1.25; // 1-2 days (+25%)
    if (hoursUntilDeadline <= 72) return 1.15; // 2-3 days (+15%)
    if (hoursUntilDeadline <= 168) return 1.05; // 3-7 days (+5%)
    return 1; // 7+ days, no extra charge
  };

  const getDeadlineLabel = () => {
    const multiplier = getDeadlineMultiplier();
    if (multiplier === 1) return "7+ days (No extra charge)";
    if (multiplier === 1.05) return "3-7 days (+5%)";
    if (multiplier === 1.15) return "2-3 days (+15%)";
    if (multiplier === 1.25) return "1-2 days (+25%)";
    return "Urgent <24h (+50%)";
  };

  const calculatePrice = () => {
    const qualityMultiplier = QUALITY_LEVELS.find(q => q.value === qualityLevel)?.multiplier || 1;
    const deadlineMultiplier = getDeadlineMultiplier();
    return (BASE_PRICE_PER_PAGE * pageCount * qualityMultiplier * deadlineMultiplier).toFixed(2);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Upload attachments first
      const attachmentUrls: string[] = [];
      for (const file of attachments) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('job-attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('job-attachments')
          .getPublicUrl(fileName);

        attachmentUrls.push(publicUrl);
      }

      // Build job data
      const effectiveSubject = getEffectiveSubject();
      const jobData = {
        title,
        description: `${description}\n\nWork Type: ${workType}\nSubject: ${effectiveSubject}\nPages: ${pageCount}\nQuality: ${qualityLevel}`,
        category: `${workType} - ${effectiveSubject}`,
        deadline: new Date(deadline).toISOString(),
        budget: parseFloat(calculatePrice()),
        attachment_urls: attachmentUrls.length > 0 ? attachmentUrls : null
      };

      // Close modal and redirect to payment page
      onOpenChange(false);

      // Reset form
      setTitle("");
      setWorkType("");
      setSubject("");
      setCustomSubject("");
      setPageCount(1);
      setQualityLevel("standard");
      setDeadline("");
      setDescription("");
      setAttachments([]);
      setStep(1);

      // Navigate to payment method page with job data
      navigate("/payment/method", { state: { jobData } });

    } catch (error: any) {
      toast({
        title: "Error preparing job",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Mathematics Assignment - Calculus"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="workType">Work Type *</Label>
              <Select value={workType} onValueChange={setWorkType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select work type" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Select value={subject} onValueChange={(val) => { setSubject(val); if (val !== "Others") setCustomSubject(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map(subj => (
                    <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {subject === "Others" && (
                <Input
                  className="mt-2"
                  placeholder="Enter your subject"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                />
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="pageCount">Number of Pages *</Label>
              <Input
                id="pageCount"
                type="number"
                min="1"
                value={pageCount}
                onChange={(e) => setPageCount(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label htmlFor="qualityLevel">Quality Level *</Label>
              <Select value={qualityLevel} onValueChange={setQualityLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUALITY_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label} ({level.multiplier}x)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="deadline">Deadline *</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="[color-scheme:dark]"
              />
            </div>
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Price</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    ৳{BASE_PRICE_PER_PAGE}/page × {pageCount} pages × {QUALITY_LEVELS.find(q => q.value === qualityLevel)?.multiplier}x quality
                  </p>
                  {deadline && (
                    <p className="text-xs text-primary mt-1">
                      Deadline: {getDeadlineLabel()}
                    </p>
                  )}
                </div>
                <p className="text-3xl font-bold text-primary">৳{calculatePrice()}</p>
              </div>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the requirements, formatting, citation style, etc."
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <Label>Attachments (Optional)</Label>
              <div className="mt-2">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Files
                    </span>
                  </Button>
                </label>
              </div>
              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm truncate">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Review Your Job</h3>
              <p className="text-muted-foreground">Make sure everything looks good before posting</p>
            </div>
            <Card className="p-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Title</p>
                <p className="font-semibold">{title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Work Type</p>
                  <p className="font-semibold">{workType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Subject</p>
                  <p className="font-semibold">{getEffectiveSubject()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pages</p>
                  <p className="font-semibold">{pageCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quality</p>
                  <p className="font-semibold">{QUALITY_LEVELS.find(q => q.value === qualityLevel)?.label}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deadline</p>
                <p className="font-semibold">{new Date(deadline).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="text-2xl font-bold text-primary">${calculatePrice()}</p>
              </div>
              {attachments.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Attachments</p>
                  <p className="font-semibold">{attachments.length} file(s)</p>
                </div>
              )}
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return title && workType && (subject === "Others" ? customSubject : subject);
      case 2:
        return pageCount > 0 && deadline;
      case 3:
        return description;
      default:
        return true;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 4 ? "Review & Post Job" : `Post New Job - Step ${step} of 4`}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {renderStep()}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="btn-glow">
              {loading ? "Posting..." : "Post Job"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
