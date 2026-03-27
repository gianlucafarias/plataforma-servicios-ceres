import { prisma } from "@/lib/prisma";
import {
  PrivateDocumentError,
  createPrivateDocumentDownloadResponse,
} from "@/lib/server/private-documents";

export async function downloadCriminalRecordForProfessional(professionalId: string) {
  const documentation = await prisma.professionalDocumentation.findUnique({
    where: { professionalId },
    select: {
      criminalRecordObjectKey: true,
      criminalRecordFileName: true,
    },
  });

  if (!documentation?.criminalRecordObjectKey || !documentation.criminalRecordFileName) {
    throw new PrivateDocumentError("not_found", "El certificado no fue cargado.", 404);
  }

  return createPrivateDocumentDownloadResponse({
    objectKey: documentation.criminalRecordObjectKey,
    fileName: documentation.criminalRecordFileName,
  });
}

export async function downloadLaborReferenceAttachment(
  professionalId: string,
  referenceId: string
) {
  const reference = await prisma.professionalLaborReference.findFirst({
    where: {
      id: referenceId,
      documentation: {
        professionalId,
      },
    },
    select: {
      attachmentObjectKey: true,
      attachmentFileName: true,
    },
  });

  if (!reference?.attachmentObjectKey || !reference.attachmentFileName) {
    throw new PrivateDocumentError("not_found", "El adjunto no existe.", 404);
  }

  return createPrivateDocumentDownloadResponse({
    objectKey: reference.attachmentObjectKey,
    fileName: reference.attachmentFileName,
  });
}
