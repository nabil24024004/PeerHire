import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNotifications } from "@/hooks/useNotifications";
import { Loader2 } from "lucide-react";

interface NotificationSettingsProps {
    userId: string;
}

export function NotificationSettings({ userId }: NotificationSettingsProps) {
    const { preferences, updatePreferences, loading } = useNotifications(userId);

    if (loading || !preferences) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                    Choose which notifications you want to receive
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="new-messages" className="flex flex-col space-y-1">
                        <span>New Messages</span>
                        <span className="font-normal text-sm text-muted-foreground">
                            Receive notifications when you get new messages
                        </span>
                    </Label>
                    <Switch
                        id="new-messages"
                        checked={preferences.new_messages}
                        onCheckedChange={(checked) =>
                            updatePreferences({ new_messages: checked })
                        }
                    />
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="new-proposals" className="flex flex-col space-y-1">
                        <span>New Proposals</span>
                        <span className="font-normal text-sm text-muted-foreground">
                            Receive notifications when freelancers submit proposals
                        </span>
                    </Label>
                    <Switch
                        id="new-proposals"
                        checked={preferences.new_proposals}
                        onCheckedChange={(checked) =>
                            updatePreferences({ new_proposals: checked })
                        }
                    />
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="new-offers" className="flex flex-col space-y-1">
                        <span>New Offers</span>
                        <span className="font-normal text-sm text-muted-foreground">
                            Receive notifications when you receive job offers
                        </span>
                    </Label>
                    <Switch
                        id="new-offers"
                        checked={preferences.new_offers}
                        onCheckedChange={(checked) =>
                            updatePreferences({ new_offers: checked })
                        }
                    />
                </div>
            </CardContent>
        </Card>
    );
}
