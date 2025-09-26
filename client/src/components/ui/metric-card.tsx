import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string | ReactNode;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  progress?: {
    value: number;
    max: number;
    label?: string;
  };
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "outline";
  };
  icon?: ReactNode;
  variant?: "default" | "publisher" | "advertiser";
  className?: string;
}

export function MetricCard({
  title,
  value,
  description,
  trend,
  progress,
  badge,
  icon,
  variant = "default",
  className,
}: MetricCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "publisher":
        return "border-publisher/20 bg-gradient-to-br from-publisher/5 to-transparent";
      case "advertiser":
        return "border-advertiser/20 bg-gradient-to-br from-advertiser/5 to-transparent";
      default:
        return "";
    }
  };

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-md", getVariantStyles(), className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          {icon && (
            <div className={cn(
              "p-2 rounded-lg",
              variant === "publisher" && "bg-publisher/10",
              variant === "advertiser" && "bg-advertiser/10",
              variant === "default" && "bg-muted"
            )}>
              {icon}
            </div>
          )}
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
        </div>
        {badge && (
          <Badge variant={badge.variant || "default"} className="h-6">
            {badge.text}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex items-end gap-2">
            <div className="text-2xl font-bold text-card-foreground">{value}</div>
            {trend && (
              <div
                className={cn(
                  "flex items-center text-xs",
                  trend.positive ? "text-advertiser" : "text-destructive"
                )}
              >
                <span className={cn(
                  "inline-block w-0 h-0 border-l-2 border-r-2 border-transparent mr-1",
                  trend.positive ? "border-b-2 border-b-advertiser" : "border-t-2 border-t-destructive"
                )}>
                </span>
                {trend.value}% {trend.label}
              </div>
            )}
          </div>
          
          {description && (
            <div className="text-xs text-muted-foreground">{description}</div>
          )}
          
          {progress && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {progress.label || "Progress"}
                </span>
                <span className="text-card-foreground">
                  {progress.value}/{progress.max}
                </span>
              </div>
              <Progress 
                value={(progress.value / progress.max) * 100} 
                className="h-2"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}