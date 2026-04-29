import { Prisma } from "@prisma/client";
import {
  sanitizeProfessionalDocumentation,
  validateProfessionalDocumentation,
} from "@/lib/validation/professional-documentation";
import { validateUploadFileName } from "@/lib/uploadValidator";

export type PrivateDocumentInput = {
  objectKey: string;
  fileName: string;
};

export type LaborReferenceInput = {
  id?: string;
  name: string;
  company: string;
  contact: string;
  attachment?: PrivateDocumentInput | null;
};

export type ProfessionalDocumentationInput = {
  criminalRecord?: PrivateDocumentInput | null;
  laborReferences?: LaborReferenceInput[];
};

export type SerializedDocumentationFile = {
  objectKey: string;
  fileName: string;
  downloadPath: string;
};

export type SerializedLaborReference = {
  id: string;
  name: string;
  company: string;
  contact: string;
  attachment: SerializedDocumentationFile | null;
};

export type SerializedProfessionalDocumentation = {
  required: boolean;
  criminalRecordPresent: boolean;
  criminalRecordStatus: "pending" | "approved" | "rejected" | null;
  criminalRecordReviewedAt: string | null;
  criminalRecordAdminNotes: string | null;
  hasLaborReferences: boolean;
  criminalRecord: SerializedDocumentationFile | null;
  laborReferences: SerializedLaborReference[];
};

export const professionalDocumentationArgs =
  Prisma.validator<Prisma.ProfessionalDocumentationDefaultArgs>()({
    select: {
      id: true,
      professionalId: true,
      criminalRecordObjectKey: true,
      criminalRecordFileName: true,
      criminalRecordStatus: true,
      criminalRecordReviewedAt: true,
      criminalRecordAdminNotes: true,
      laborReferences: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          company: true,
          contact: true,
          attachmentObjectKey: true,
          attachmentFileName: true,
        },
      },
    },
  });

export type ProfessionalDocumentationRecord = Prisma.ProfessionalDocumentationGetPayload<
  typeof professionalDocumentationArgs
>;

export class ProfessionalDocumentationError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizePrivateDocumentInput(value: unknown, fieldName: string): PrivateDocumentInput | null {
  if (value == null) {
    return null;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new ProfessionalDocumentationError(
      "validation_error",
      `${fieldName} es invalido.`,
      400
    );
  }

  const body = value as Record<string, unknown>;
  const objectKey = normalizeOptionalString(body.objectKey);
  const fileName = normalizeOptionalString(body.fileName);

  if (!objectKey || !fileName) {
    throw new ProfessionalDocumentationError(
      "validation_error",
      `${fieldName} debe incluir objectKey y fileName.`,
      400
    );
  }

  const fileNameError = validateUploadFileName(fileName);
  if (fileNameError) {
    throw new ProfessionalDocumentationError("validation_error", fileNameError, 400);
  }

  return { objectKey, fileName };
}

function normalizeLaborReferenceInput(value: unknown): LaborReferenceInput | null {
  if (typeof value !== "object" || !value || Array.isArray(value)) {
    throw new ProfessionalDocumentationError(
      "validation_error",
      "Cada referencia laboral debe ser un objeto valido.",
      400
    );
  }

  const body = value as Record<string, unknown>;
  const id = normalizeOptionalString(body.id) || undefined;
  const name = normalizeOptionalString(body.name);
  const company = normalizeOptionalString(body.company);
  const contact = normalizeOptionalString(body.contact);
  const attachment = normalizePrivateDocumentInput(body.attachment, "El adjunto de la referencia");
  const normalized = sanitizeProfessionalDocumentation({
    laborReferences: [
      {
        id,
        name: name ?? "",
        company: company ?? "",
        contact: contact ?? "",
        attachment,
      },
    ],
  }).laborReferences?.[0];

  if (!normalized) {
    return null;
  }

  const validation = validateProfessionalDocumentation({
    laborReferences: [normalized],
  });

  if (!validation.isValid) {
    const fieldErrors = validation.errors.laborReferencesByIndex[0];
    const message =
      fieldErrors?.name ||
      fieldErrors?.company ||
      fieldErrors?.contact ||
      validation.errors.laborReferences ||
      "Cada referencia laboral debe incluir nombre, empresa y contacto.";

    throw new ProfessionalDocumentationError("validation_error", message, 400);
  }

  return {
    id,
    name: normalized.name,
    company: normalized.company,
    contact: normalized.contact,
    attachment,
  };
}

export function normalizeProfessionalDocumentationInput(
  value: unknown
): { provided: boolean; documentation: ProfessionalDocumentationInput } {
  if (value === undefined) {
    return {
      provided: false,
      documentation: {
        criminalRecord: null,
        laborReferences: [],
      },
    };
  }

  if (value == null) {
    return {
      provided: true,
      documentation: {
        criminalRecord: null,
        laborReferences: [],
      },
    };
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new ProfessionalDocumentationError(
      "validation_error",
      "La documentacion enviada es invalida.",
      400
    );
  }

  const body = value as Record<string, unknown>;
  const criminalRecord = normalizePrivateDocumentInput(
    body.criminalRecord,
    "El certificado de antecedentes"
  );
  const laborReferences = Array.isArray(body.laborReferences)
    ? body.laborReferences
        .map((reference) => normalizeLaborReferenceInput(reference))
        .filter((reference): reference is LaborReferenceInput => reference !== null)
    : [];

  const documentation = {
    criminalRecord,
    laborReferences,
  };
  const validation = validateProfessionalDocumentation(documentation);

  if (!validation.isValid) {
    const firstReferenceError = validation.errors.laborReferencesByIndex.find((referenceErrors) =>
      Object.values(referenceErrors).some(Boolean)
    );
    const message =
      validation.errors.criminalRecord ||
      validation.errors.laborReferences ||
      firstReferenceError?.name ||
      firstReferenceError?.company ||
      firstReferenceError?.contact ||
      "La documentacion enviada es invalida.";

    throw new ProfessionalDocumentationError("validation_error", message, 400);
  }

  return {
    provided: true,
    documentation: {
      criminalRecord: validation.sanitized.criminalRecord
        ? {
            objectKey: validation.sanitized.criminalRecord.objectKey || "",
            fileName: validation.sanitized.criminalRecord.fileName,
          }
        : null,
      laborReferences: (validation.sanitized.laborReferences ?? []).map((reference) => ({
        id: reference.id,
        name: reference.name,
        company: reference.company,
        contact: reference.contact,
        attachment: reference.attachment
          ? {
              objectKey: reference.attachment.objectKey || "",
              fileName: reference.attachment.fileName,
            }
          : null,
      })),
    },
  };
}

export function isProfessionalDocumentationComplete(input: {
  requiresDocumentation: boolean;
  documentation?: Pick<ProfessionalDocumentationRecord, "criminalRecordObjectKey"> | null;
}) {
  if (!input.requiresDocumentation) {
    return true;
  }

  return !!input.documentation?.criminalRecordObjectKey;
}

function buildSerializedFile(
  objectKey: string,
  fileName: string,
  downloadPath: string
): SerializedDocumentationFile {
  return {
    objectKey,
    fileName,
    downloadPath,
  };
}

function serializeDocumentation(
  documentation: ProfessionalDocumentationRecord | null | undefined,
  config: {
    required: boolean;
    criminalRecordDownloadPath: string;
    laborReferenceDownloadPath: (referenceId: string) => string;
  }
): SerializedProfessionalDocumentation {
  const criminalRecord =
    documentation?.criminalRecordObjectKey && documentation.criminalRecordFileName
      ? buildSerializedFile(
          documentation.criminalRecordObjectKey,
          documentation.criminalRecordFileName,
          config.criminalRecordDownloadPath
        )
      : null;

  const laborReferences = (documentation?.laborReferences ?? []).map((reference) => ({
    id: reference.id,
    name: reference.name,
    company: reference.company,
    contact: reference.contact,
    attachment:
      reference.attachmentObjectKey && reference.attachmentFileName
        ? buildSerializedFile(
            reference.attachmentObjectKey,
            reference.attachmentFileName,
            config.laborReferenceDownloadPath(reference.id)
          )
        : null,
  }));

  return {
    required: config.required,
    criminalRecordPresent: !!criminalRecord,
    criminalRecordStatus: documentation?.criminalRecordStatus ?? null,
    criminalRecordReviewedAt: documentation?.criminalRecordReviewedAt?.toISOString() ?? null,
    criminalRecordAdminNotes: documentation?.criminalRecordAdminNotes ?? null,
    hasLaborReferences: laborReferences.length > 0,
    criminalRecord,
    laborReferences,
  };
}

export function serializeSelfDocumentation(
  professionalId: string,
  requiresDocumentation: boolean,
  documentation: ProfessionalDocumentationRecord | null | undefined
) {
  void professionalId;
  return serializeDocumentation(documentation, {
    required: requiresDocumentation,
    criminalRecordDownloadPath: "/api/v1/professional/documents/criminal-record",
    laborReferenceDownloadPath: (referenceId) =>
      `/api/v1/professional/documents/references/${referenceId}`,
  });
}

export function serializeAdminDocumentation(
  professionalId: string,
  requiresDocumentation: boolean,
  documentation: ProfessionalDocumentationRecord | null | undefined
) {
  return serializeDocumentation(documentation, {
    required: requiresDocumentation,
    criminalRecordDownloadPath: `/api/admin/professionals/${professionalId}/documents/criminal-record`,
    laborReferenceDownloadPath: (referenceId) =>
      `/api/admin/professionals/${professionalId}/documents/references/${referenceId}`,
  });
}

export async function upsertProfessionalDocumentation(
  tx: Prisma.TransactionClient,
  professionalId: string,
  documentation: ProfessionalDocumentationInput
) {
  const criminalRecord = documentation.criminalRecord ?? null;
  const laborReferences = documentation.laborReferences ?? [];

  if (!criminalRecord && laborReferences.length === 0) {
    await tx.professionalDocumentation.deleteMany({
      where: { professionalId },
    });
    return;
  }

  const record = await tx.professionalDocumentation.upsert({
    where: { professionalId },
    update: {
      criminalRecordObjectKey: criminalRecord?.objectKey || null,
      criminalRecordFileName: criminalRecord?.fileName || null,
      criminalRecordStatus: criminalRecord ? "pending" : null,
      criminalRecordReviewedAt: null,
      criminalRecordAdminNotes: null,
    },
    create: {
      professionalId,
      criminalRecordObjectKey: criminalRecord?.objectKey || null,
      criminalRecordFileName: criminalRecord?.fileName || null,
      criminalRecordStatus: criminalRecord ? "pending" : null,
    },
    select: { id: true },
  });

  await tx.professionalLaborReference.deleteMany({
    where: { documentationId: record.id },
  });

  if (laborReferences.length > 0) {
    await tx.professionalLaborReference.createMany({
      data: laborReferences.map((reference) => ({
        documentationId: record.id,
        name: reference.name,
        company: reference.company,
        contact: reference.contact,
        attachmentObjectKey: reference.attachment?.objectKey || null,
        attachmentFileName: reference.attachment?.fileName || null,
      })),
    });
  }
}
