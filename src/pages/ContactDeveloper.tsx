import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout"; 

const ContactDeveloper = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { name, department, ID, email } = location.state || {};

    // Construct WhatsApp message
    const phoneNumber = "01823604026";


    const message = `Hello Developer,%0A%0AI would like to request access to PeerHire.%0A%0AName: ${name || "N/A"}%0ADepartment: ${department || "N/A"}%0AID: ${ID || "N/A"}`;

    const whatsappUrl = `https://wa.me/+88${phoneNumber}?text=${message}`;

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <div className="flex-1 flex items-center justify-center px-4 py-6 md:p-6">
                <div className="w-full max-w-md">
                    <Card className="p-8 border-border bg-card shadow-lg animate-fade-in-up">
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 mx-auto rounded-full bg-purple-500/10 flex items-center justify-center">
                                <MessageSquare className="w-8 h-8 text-green-500" />
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold">Request Access</h1>
                                <p className="text-muted-foreground">
                                    To ensure security, please contact the developer on WhatsApp (+8801823604026) to get your login credentials.
                                </p>
                            </div>

                            <div className="bg-muted/50 p-4 rounded-lg text-left text-sm space-y-2">
                                <p className="font-semibold text-foreground">Your Details:</p>
                                <div className="space-y-1 text-muted-foreground">
                                    <p>Name: <span className="text-foreground">{name}</span></p>
                                    <p>Department: <span className="text-foreground">{department}</span></p>
                                    <p>Student ID: <span className="text-foreground">{ID}</span></p>
                                </div>
                            </div>

                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full"
                            >
                                <Button className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-semibold gap-2 shadow-lg hover:shadow-xl transition-all">
                                    <MessageSquare className="w-5 h-5" />
                                    Contact on WhatsApp
                                </Button>
                            </a>

                            <Button
                                variant="ghost"
                                className="w-full"
                                onClick={() => navigate("/login")}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Login
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ContactDeveloper;
