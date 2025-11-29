import { DashboardLayout } from "@/components/DashboardLayout";
import { SavedJobsList } from "@/components/SavedJobsList";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const FreelancerSavedJobs = () => {
    const { user, role, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && (!user || role !== "freelancer")) {
            navigate("/");
        }
    }, [user, role, loading, navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <DashboardLayout role="freelancer">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Saved Jobs</h1>
                    <p className="text-muted-foreground mt-2">
                        Jobs you've saved to review or apply to later
                    </p>
                </div>
                <SavedJobsList userId={user.id} />
            </div>
        </DashboardLayout>
    );
};

export default FreelancerSavedJobs;
