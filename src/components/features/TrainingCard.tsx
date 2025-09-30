import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin, ExternalLink } from "lucide-react";
import { Training } from "@/types";

interface TrainingCardProps {
  training: Training;
}

export function TrainingCard({ training }: TrainingCardProps) {
  const formattedDate = new Date(training.startDate).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 rounded-2xl border border-gray-100 overflow-hidden pt-0 h-full flex flex-col">
      {training.imageUrl && (
        <div className="relative h-40 w-full">
          <Image src={training.imageUrl} alt={training.title} fill className="object-cover" />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg leading-tight mr-2">{training.title}</h3>
          <Badge variant="outline" className="capitalize rounded-xl">
            {training.modality}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground line-clamp-3">{training.description}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="truncate" title={training.location}>{training.location}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {training.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-700">
              {tag}
            </span>
          ))}
        </div>
        {training.registrationUrl && (
          <Button asChild size="sm" className="mt-auto bg-[var(--gov-green)] hover:bg-[var(--gov-green-dark)] text-white">
            <Link href={training.registrationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
              Inscribirme
              <ExternalLink className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}


