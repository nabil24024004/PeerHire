import { Bell, Check, CheckCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface NotificationCenterProps {
    userId: string;
}

export function NotificationCenter({ userId }: NotificationCenterProps) {
    const { notifications, unreadCount, markAsRead, markAllAsRead, loading } =
        useNotifications(userId);

    const getNotificationIcon = (type: string) => {
        // Return appropriate icon based on notification type
        return <Bell className="h-4 w-4" />;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="h-auto p-1 text-xs"
                        >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[400px]">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Loading notifications...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Bell className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                            <p className="text-sm text-muted-foreground">
                                No notifications yet
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {notifications.map((notification) => (
                                <DropdownMenuItem
                                    key={notification.id}
                                    className={cn(
                                        "flex flex-col items-start gap-1 p-3 cursor-pointer",
                                        !notification.read && "bg-accent/50"
                                    )}
                                    onClick={() => !notification.read && markAsRead(notification.id)}
                                >
                                    <div className="flex items-start justify-between w-full gap-2">
                                        <div className="flex items-start gap-2 flex-1">
                                            <div className="mt-0.5">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(notification.created_at), {
                                                        addSuffix: true,
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        {!notification.read && (
                                            <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                                        )}
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
