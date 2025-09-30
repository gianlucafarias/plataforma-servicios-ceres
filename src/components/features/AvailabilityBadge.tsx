import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { checkProfessionalAvailability, type ProfessionalSchedule } from "@/lib/availability";

interface AvailabilityBadgeProps {
  schedule?: ProfessionalSchedule | null;
  variant?: 'default' | 'compact' | 'detailed';
  showIcon?: boolean;
  showReason?: boolean;
}

export function AvailabilityBadge({ 
  schedule, 
  variant = 'default',
  showIcon = true,
  showReason = false
}: AvailabilityBadgeProps) {
  const availability = checkProfessionalAvailability(schedule);

  const getVariant = () => {
    if (availability.isAvailable) {
      return 'default';
    }
    return 'destructive';
  };

  const getClassName = () => {
    const baseClasses = "text-xs";
    
    if (variant === 'compact') {
      return `${baseClasses} px-2 py-1`;
    }
    
    return `${baseClasses} px-3 py-1`;
  };

  if (variant === 'detailed' && showReason && availability.reason && !availability.isAvailable) {
    return (
      <div className="flex flex-col gap-1">
        <Badge 
          variant={getVariant()} 
          className={getClassName()}
        >
          {showIcon && <Clock className="h-3 w-3 mr-1" />}
          {availability.status}
        </Badge>
        <span className="text-xs text-gray-600">{availability.reason}</span>
      </div>
    );
  }

  return (
    <Badge 
      variant={getVariant()} 
      className={getClassName()}
    >
      {showIcon && <Clock className="h-3 w-3 mr-1" />}
      {availability.status}
    </Badge>
  );
}
