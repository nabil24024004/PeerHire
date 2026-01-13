import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ComponentType, SVGProps } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className
}: StatCardProps) => {
  return (
    <Card
      className={cn(
        "p-4 md:p-6 card-hover border-border bg-card animate-fade-in-up",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 md:space-y-2 flex-1">
          <p className="text-xs md:text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground">{value}</h3>
            {trend && (
              <span className={cn(
                "text-sm font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}>
                {trend.value}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground hidden md:block">{description}</p>
          )}
        </div>
        <div className="p-2 md:p-3 rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5 md:h-6 md:w-6" />
        </div>
      </div>
    </Card>
  );
};
