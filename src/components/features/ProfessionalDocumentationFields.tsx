'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { LaborReference, PrivateDocumentFile, ProfessionalDocumentation } from '@/types';
import {
  PROFESSIONAL_DOCUMENTATION_LIMITS,
  sanitizeDocumentationReferenceField,
  validateProfessionalDocumentation,
} from '@/lib/validation/professional-documentation';
import { FileBadge2, FileText, Loader2, Plus, ShieldCheck, Trash2, Upload } from 'lucide-react';

type ProfessionalDocumentationFieldsProps = {
  value: ProfessionalDocumentation | undefined;
  onChange: (value: ProfessionalDocumentation) => void;
  uploadDocument: (file: File) => Promise<PrivateDocumentFile>;
  errors?: {
    criminalRecord?: string;
    laborReferences?: string;
  };
  helperText?: string;
};

function createEmptyReference(): LaborReference {
  return {
    name: '',
    company: '',
    contact: '',
    attachment: null,
  };
}

export function ProfessionalDocumentationFields({
  value,
  onChange,
  uploadDocument,
  errors,
  helperText,
}: ProfessionalDocumentationFieldsProps) {
  const documentation: ProfessionalDocumentation = {
    criminalRecord: value?.criminalRecord ?? null,
    laborReferences: value?.laborReferences ?? [],
  };
  const [uploadingCriminalRecord, setUploadingCriminalRecord] = useState(false);
  const [uploadingReferenceIndex, setUploadingReferenceIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const localValidation = useMemo(
    () => validateProfessionalDocumentation(documentation),
    [documentation]
  );
  const localReferenceErrors = localValidation.errors.laborReferencesByIndex;

  const updateDocumentation = (next: ProfessionalDocumentation) => {
    onChange({
      criminalRecord: next.criminalRecord ?? null,
      laborReferences: next.laborReferences ?? [],
    });
  };

  const updateReference = (index: number, patch: Partial<LaborReference>) => {
    const nextReferences = [...(documentation.laborReferences ?? [])];
    nextReferences[index] = {
      ...nextReferences[index],
      ...patch,
    };
    updateDocumentation({
      ...documentation,
      laborReferences: nextReferences,
    });
  };

  const removeReference = (index: number) => {
    const nextReferences = [...(documentation.laborReferences ?? [])];
    nextReferences.splice(index, 1);
    updateDocumentation({
      ...documentation,
      laborReferences: nextReferences,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border border-emerald-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-gray-900">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            Certificado de antecedentes penales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Este documento es obligatorio para que el perfil pueda aparecer en la plataforma.
          </div>

          {helperText ? (
            <p className="text-sm text-gray-600">{helperText}</p>
          ) : null}

          {documentation.criminalRecord ? (
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-emerald-700" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {documentation.criminalRecord.fileName}
                  </p>
                  {documentation.criminalRecord.downloadPath ? (
                    <a
                      href={documentation.criminalRecord.downloadPath}
                      className="text-xs text-emerald-700 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Descargar archivo actual
                    </a>
                  ) : null}
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() =>
                  updateDocumentation({
                    ...documentation,
                    criminalRecord: null,
                  })
                }
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Quitar
              </Button>
            </div>
          ) : null}

          <div>
            <Label htmlFor="criminal-record-upload">Subir certificado</Label>
            <div className="relative mt-2">
              <Upload className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="criminal-record-upload"
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                className="pl-10"
                disabled={uploadingCriminalRecord}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }

                  try {
                    setUploadingCriminalRecord(true);
                    setUploadError(null);
                    const uploaded = await uploadDocument(file);
                    updateDocumentation({
                      ...documentation,
                      criminalRecord: uploaded,
                    });
                  } catch (error) {
                    const message =
                      error instanceof Error
                        ? error.message
                        : "No se pudo subir el certificado. Intenta nuevamente.";
                    setUploadError(message);
                  } finally {
                    setUploadingCriminalRecord(false);
                    event.currentTarget.value = '';
                  }
                }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              PDF, DOC, DOCX, JPG o PNG. Se guarda de forma privada.
            </p>
            {uploadingCriminalRecord ? (
              <div className="mt-2 flex items-center gap-2 text-sm text-emerald-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                Subiendo certificado...
              </div>
            ) : null}
            {errors?.criminalRecord ? (
              <p className="mt-2 text-sm text-red-600">{errors.criminalRecord}</p>
            ) : null}
            {uploadError ? (
              <p className="mt-2 text-sm text-red-600">{uploadError}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-gray-900">
            <FileBadge2 className="h-4 w-4 text-emerald-700" />
            Referencias laborales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Son opcionales. Si cargas al menos una, en tu perfil se mostrará que cuentas con
            referencias laborales.
          </p>

          {(documentation.laborReferences ?? []).map((reference, index) => (
            <div key={reference.id ?? `reference-${index}`} className="rounded-2xl border border-gray-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Referencia {index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => removeReference(index)}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Eliminar
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Nombre</Label>
                  <Input
                    value={reference.name}
                    maxLength={PROFESSIONAL_DOCUMENTATION_LIMITS.referenceNameMaxLength}
                    onChange={(event) =>
                      updateReference(index, {
                        name: sanitizeDocumentationReferenceField(event.target.value),
                      })
                    }
                    placeholder="Nombre del referente"
                  />
                  {localReferenceErrors[index]?.name ? (
                    <p className="mt-1 text-xs text-red-600">{localReferenceErrors[index]?.name}</p>
                  ) : null}
                </div>
                <div>
                  <Label>Empresa</Label>
                  <Input
                    value={reference.company}
                    maxLength={PROFESSIONAL_DOCUMENTATION_LIMITS.referenceCompanyMaxLength}
                    onChange={(event) =>
                      updateReference(index, {
                        company: sanitizeDocumentationReferenceField(event.target.value),
                      })
                    }
                    placeholder="Empresa o lugar de trabajo"
                  />
                  {localReferenceErrors[index]?.company ? (
                    <p className="mt-1 text-xs text-red-600">{localReferenceErrors[index]?.company}</p>
                  ) : null}
                </div>
                <div>
                  <Label>Contacto</Label>
                  <Input
                    value={reference.contact}
                    maxLength={PROFESSIONAL_DOCUMENTATION_LIMITS.referenceContactMaxLength}
                    onChange={(event) =>
                      updateReference(index, {
                        contact: sanitizeDocumentationReferenceField(event.target.value),
                      })
                    }
                    placeholder="Telefono o email"
                  />
                  {localReferenceErrors[index]?.contact ? (
                    <p className="mt-1 text-xs text-red-600">{localReferenceErrors[index]?.contact}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {reference.attachment ? (
                  <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {reference.attachment.fileName}
                      </p>
                      {reference.attachment.downloadPath ? (
                        <a
                          href={reference.attachment.downloadPath}
                          className="text-xs text-emerald-700 hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Descargar adjunto actual
                        </a>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => updateReference(index, { attachment: null })}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Quitar adjunto
                    </Button>
                  </div>
                ) : null}

                <div>
                  <Label htmlFor={`reference-attachment-${index}`}>Adjunto opcional</Label>
                  <div className="relative mt-2">
                    <Upload className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id={`reference-attachment-${index}`}
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      className="pl-10"
                      disabled={uploadingReferenceIndex === index}
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) {
                          return;
                        }

                        try {
                          setUploadingReferenceIndex(index);
                          setUploadError(null);
                          const uploaded = await uploadDocument(file);
                          updateReference(index, { attachment: uploaded });
                        } catch (error) {
                          const message =
                            error instanceof Error
                              ? error.message
                              : "No se pudo subir el adjunto. Intenta nuevamente.";
                          setUploadError(message);
                        } finally {
                          setUploadingReferenceIndex(null);
                          event.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                  {uploadingReferenceIndex === index ? (
                    <div className="mt-2 flex items-center gap-2 text-sm text-emerald-700">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Subiendo adjunto...
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
            disabled={
              (documentation.laborReferences ?? []).length >=
              PROFESSIONAL_DOCUMENTATION_LIMITS.maxReferences
            }
            onClick={() =>
              updateDocumentation({
                ...documentation,
                laborReferences: [...(documentation.laborReferences ?? []), createEmptyReference()],
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar referencia laboral
          </Button>
          <p className="text-xs text-gray-500">
            Puedes cargar hasta {PROFESSIONAL_DOCUMENTATION_LIMITS.maxReferences} referencias.
          </p>

          {errors?.laborReferences ? (
            <p className="text-sm text-red-600">{errors.laborReferences}</p>
          ) : null}
          {uploadError ? (
            <p className="text-sm text-red-600">{uploadError}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
