import { Card } from "@/components/ui/card";

export function CategoryCardSkeleton() {
  return (
    <Card className="relative h-full flex items-center justify-center text-center rounded-2xl border border-transparent p-0 overflow-hidden">
      {/* Skeleton de imagen de fondo */}
      <div className="absolute inset-0 bg-gray-300 animate-pulse" />
      
      {/* Skeleton del overlay de gradiente */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-400/20 via-gray-400/40 to-gray-500/60" />
      
      {/* Skeleton del contenido */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-8">
        {/* Skeleton del texto */}
        <div className="w-24 h-8  rounded animate-pulse" />
      </div>
    </Card>
  );
}