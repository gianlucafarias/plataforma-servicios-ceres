import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { Review } from "@/types";

interface ReviewSectionProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

export function ReviewSection({ reviews, averageRating, totalReviews }: ReviewSectionProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating
            ? "fill-yellow-400 text-yellow-400"
            : "fill-gray-200 text-gray-200"
        }`}
      />
    ));
  };

  const getRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach(review => {
      distribution[review.rating - 1]++;
    });
    return distribution.reverse(); // Para mostrar de 5 a 1 estrellas
  };

  const distribution = getRatingDistribution();

  return (
    <div className="space-y-6">
      {/* Resumen de calificaciones */}
      <Card className="rounded-2xl border border-gray-100">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calificación promedio */}
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center mb-2">
                {renderStars(Math.round(averageRating))}
              </div>
              <p className="text-gray-600">
                Basado en {totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'}
              </p>
            </div>

            {/* Distribución de calificaciones */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars, index) => {
                const count = distribution[index];
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                
                return (
                  <div key={stars} className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700 w-8">
                      {stars}
                    </span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-yellow-400 h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de reseñas */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 font-rutan">
          Opiniones de clientes
        </h3>
        
        {reviews.length === 0 ? (
          <Card className="rounded-2xl border border-gray-100">
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h4 className="font-medium mb-2">Aún no hay reseñas</h4>
                <p className="text-sm">
                  Este profesional aún no tiene reseñas de clientes.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="rounded-2xl border border-gray-100 hover:shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-10 w-10 border border-gray-100">
                      <AvatarFallback className="bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 font-medium text-sm">
                        {review.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {review.user?.name || 'Usuario anónimo'}
                          </h4>
                          <div className="flex items-center space-x-1">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('es-AR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

