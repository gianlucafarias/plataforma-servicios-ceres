"use client";

import { Check, Circle, X } from "lucide-react";
import type { CategoryGroup } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type NamedOption = {
  slug: string;
  name: string;
};

type ServiceDraft = {
  areaSlug: string;
  categoryId: string;
  title: string;
  description: string;
};

interface ServiceSelectionCardProps {
  group: CategoryGroup;
  index: number;
  service: ServiceDraft;
  areas: NamedOption[];
  categoryOptions: NamedOption[];
  selectedAreaName?: string;
  selectedServiceName?: string;
  categoriesLoading: boolean;
  areaError?: string;
  categoryError?: string;
  descriptionError?: string;
  canRemove?: boolean;
  onAreaChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onRemove?: () => void;
}

export function ServiceSelectionCard({
  group,
  index,
  service,
  areas,
  categoryOptions,
  selectedAreaName,
  selectedServiceName,
  categoriesLoading,
  areaError,
  categoryError,
  descriptionError,
  canRemove = false,
  onAreaChange,
  onCategoryChange,
  onDescriptionChange,
  onRemove,
}: ServiceSelectionCardProps) {
  const isProfession = group === "profesiones";
  const waitingForArea = !isProfession && !service.areaSlug;
  const usesParentArea = !isProfession && !!service.areaSlug && categoryOptions.length === 0;
  const resolvedServiceName = selectedServiceName || (usesParentArea ? selectedAreaName || "" : "");
  const serviceOptions = usesParentArea
    ? selectedAreaName
      ? [{ slug: service.categoryId || service.areaSlug, name: selectedAreaName, selected: true }]
      : []
    : categoryOptions.map((option) => ({
        slug: option.slug,
        name: option.name,
        selected: service.categoryId === option.slug,
      }));

  const renderOptionGrid = (
    options: Array<{ slug: string; name: string; selected: boolean }>,
    onSelect: (slug: string) => void,
    columnsClassName = "sm:grid-cols-2"
  ) => (
    <div className={`grid gap-2 ${columnsClassName}`}>
      {options.map((option) => (
        <button
          key={option.slug}
          type="button"
          onClick={() => onSelect(option.slug)}
          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
            option.selected
              ? "border-[#006F4B] bg-[#006F4B] text-white shadow-sm"
              : "border-gray-200 bg-white text-gray-700 hover:border-[#006F4B]/40 hover:bg-[#006F4B]/[0.04]"
          }`}
        >
          <span className="text-sm font-medium leading-snug">{option.name}</span>
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
              option.selected ? "border-white/40 bg-white/10" : "border-gray-200 bg-gray-50"
            }`}
          >
            {option.selected ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-gray-300" />
            )}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <Card className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <CardContent className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#006F4B]/70">
              {isProfession ? "Perfil profesional" : `Servicio ${index + 1}`}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-gray-900">
              {isProfession ? "Elegi tu profesion" : "Elegi el servicio que queres publicar"}
            </h3>
          </div>
          {canRemove && onRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="shrink-0 rounded-full px-3 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <X className="mr-1 h-4 w-4" />
              Quitar
            </Button>
          ) : null}
        </div>

        {!isProfession ? (
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Area principal</Label>
            {categoriesLoading ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
                Cargando areas...
              </div>
            ) : (
              <Select value={service.areaSlug} onValueChange={onAreaChange}>
                <SelectTrigger
                  className={`min-h-12 rounded-2xl border-2 bg-white transition-all duration-200 focus:border-[#006F4B] focus:ring-4 focus:ring-green-100 ${
                    areaError ? "border-red-300" : "border-gray-200"
                  }`}
                >
                  <SelectValue placeholder="Selecciona un area" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area.slug} value={area.slug}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {areaError ? <p className="text-sm text-red-600">{areaError}</p> : null}
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm font-semibold text-gray-700">
              {isProfession ? "Profesiones disponibles" : "Servicios disponibles"}
            </Label>
          </div>

          {categoriesLoading ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
              Cargando categorias...
            </div>
          ) : waitingForArea ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
              Selecciona un area.
            </div>
          ) : (
            renderOptionGrid(serviceOptions, onCategoryChange)
          )}

          {categoryError ? <p className="text-sm text-red-600">{categoryError}</p> : null}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-[linear-gradient(135deg,rgba(0,111,75,0.06),rgba(0,111,75,0.01))] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#006F4B]/70">
            Seleccion actual
          </p>
          <p className="mt-2 text-base font-semibold text-gray-900">
            {resolvedServiceName ||
              (isProfession
                ? "Todavia no elegiste una profesion."
                : "Todavia no elegiste un servicio para esta tarjeta.")}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <Label className="text-sm font-semibold text-gray-700">Descripcion</Label>
          <Textarea
            value={service.description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            className={`mt-2 min-h-[104px] resize-none rounded-2xl border-2 bg-white transition-all duration-200 focus:border-[#006F4B] focus:ring-4 focus:ring-green-100 ${
              descriptionError ? "border-red-300" : "border-gray-200"
            }`}
            placeholder={
              isProfession
                ? "Contanos tu formacion, matricula si aplica y el tipo de consultas o trabajos que realizas."
                : "Describe con claridad que incluye este servicio, que tipo de trabajos haces y cualquier detalle util."
            }
          />
          {descriptionError ? <p className="mt-2 text-sm text-red-600">{descriptionError}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
