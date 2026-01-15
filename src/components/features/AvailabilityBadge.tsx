import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { checkProfessionalAvailability, type ProfessionalSchedule } from "@/lib/availability";
import { useMemo, memo } from "react";

interface AvailabilityBadgeProps {
  schedule?: ProfessionalSchedule | null;
  variant?: 'default' | 'compact' | 'detailed';
  showIcon?: boolean;
  showReason?: boolean;
}

function AvailabilityBadgeComponent({ 
  schedule, 
  variant = 'default',
  showIcon = true,
  showReason = false
}: AvailabilityBadgeProps) {
  // Memoizar el cálculo de disponibilidad
  const availability = useMemo(() => 
    checkProfessionalAvailability(schedule),
    [schedule]
  );

  const badgeVariant = availability.isAvailable ? 'default' : 'destructive';
  
  const className = variant === 'compact' 
    ? "text-xs px-2 py-1" 
    : "text-xs px-3 py-1";

  if (variant === 'detailed' && showReason && availability.reason && !availability.isAvailable) {
    return (
      <div className="flex flex-col gap-1">
        <Badge 
          variant={badgeVariant} 
          className={className}
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
      variant={badgeVariant} 
      className={className}
    >
      {showIcon && <Clock className="h-3 w-3 mr-1" />}
      {availability.status}
    </Badge>
  );
}

export const AvailabilityBadge = memo(AvailabilityBadgeComponent);
