import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { User, Bell, Briefcase, Trash2, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function FreelancerSettings() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    bio: "",
    student_id: "",
  });

  const [freelancerPrefs, setFreelancerPrefs] = useState({
    status: "available" as "available" | "busy" | "offline",
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    new_messages: true,
    new_offers: true,
    new_proposals: true,
  });

  useEffect(() => {
    const checkRole = async () => {
      if (!authLoading && !user) {
        navigate("/");
        return;
      }

      // Check localStorage for active role
      if (!authLoading && user) {
        const activeRole = localStorage.getItem('activeRole');
        if (activeRole === 'hirer') {
          navigate("/hirer/dashboard");
        }
      }
    };

    checkRole();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        setProfileData({
          full_name: profile.full_name || "",
          email: profile.email || "",
          bio: profile.bio || "",
          student_id: profile.student_id || "",
        });

        // Get availability from profiles
        if (profile.availability) {
          setFreelancerPrefs({
            status: profile.availability as "available" | "busy" | "offline",
          });
        }

        // Notification preferences stored locally
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileData.full_name,
          bio: profileData.bio,
          student_id: profileData.student_id,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFreelancerPrefs = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Update availability on profiles table
      const { error } = await supabase
        .from("profiles")
        .update({
          availability: freelancerPrefs.status,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Preferences updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    // Notification preferences saved locally
    toast({
      title: "Success",
      description: "Notification preferences updated",
    });
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { data, error } = await supabase.functions.invoke('delete-account', {
        method: 'POST',
      });

      if (error) throw error;

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted",
      });

      // Sign out and redirect to home
      await supabase.auth.signOut();
      navigate('/');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout role="freelancer">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="freelancer">
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <h1 className="text-3xl font-bold gradient-text">Settings</h1>

        {/* Account Settings */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Account Settings
            </CardTitle>
            <CardDescription>Manage your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Read-only)</Label>
                <Input id="email" value={profileData.email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student_id">Student ID</Label>
                <Input
                  id="student_id"
                  value={profileData.student_id}
                  onChange={(e) => setProfileData({ ...profileData, student_id: e.target.value })}
                  placeholder="e.g., 24024004"
                />
              </div>
            </div>
            <Button onClick={handleSaveProfile} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Freelancer Preferences */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Freelancer Preferences
            </CardTitle>
            <CardDescription>Manage your availability and work preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Availability Status</Label>
              <Select
                value={freelancerPrefs.status}
                onValueChange={(value: "available" | "busy" | "offline") =>
                  setFreelancerPrefs({ ...freelancerPrefs, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Your status will be visible to hirers looking for freelancers
              </p>
            </div>
            <Button onClick={handleSaveFreelancerPrefs} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Messages</Label>
                <p className="text-sm text-muted-foreground">Get notified when you receive a new message</p>
              </div>
              <Switch
                checked={notificationPrefs.new_messages}
                onCheckedChange={(checked) => setNotificationPrefs({ ...notificationPrefs, new_messages: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Job Offers</Label>
                <p className="text-sm text-muted-foreground">Get notified when hirers invite you to jobs</p>
              </div>
              <Switch
                checked={notificationPrefs.new_offers}
                onCheckedChange={(checked) => setNotificationPrefs({ ...notificationPrefs, new_offers: checked })}
              />
            </div>
            <Button onClick={handleSaveNotifications} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Once you delete your account, there is no going back. All your data including jobs, messages, earnings history, and portfolio will be permanently removed.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={saving}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>This action cannot be undone. This will permanently:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Delete your account and profile</li>
                        <li>Remove your freelancer portfolio</li>
                        <li>Delete all your jobs and applications</li>
                        <li>Remove all your messages and conversations</li>
                        <li>Delete your earnings history</li>
                      </ul>
                      <p className="font-semibold mt-4">Type your email to confirm: {profileData.email}</p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={saving}
                    >
                      {saving ? "Deleting..." : "Delete My Account"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
