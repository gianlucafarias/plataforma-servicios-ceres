import { NextRequest, NextResponse } from "next/server";
import { fail, requestMeta } from "@/lib/api-response";
import { requireAdminApiKey } from "@/lib/auth-helpers";
import { PrivateDocumentError } from "@/lib/server/private-documents";
import { downloadLaborReferenceAttachment } from "@/lib/server/professional-document-downloads";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; referenceId: string }> }
) {
  const meta = requestMeta(request);
  const { error } = requireAdminApiKey(request);
  if (error) {
    return error;
  }

  try {
    const { id, referenceId } = await params;
    return downloadLaborReferenceAttachment(id, referenceId);
  } catch (err) {
    if (err instanceof PrivateDocumentError) {
      return NextResponse.json(fail(err.code, err.message, undefined, meta), {
        status: err.status,
      });
    }

    console.error("Error descargando adjunto de referencia para admin:", err);
    return NextResponse.json(
      fail("server_error", "No se pudo descargar el documento.", undefined, meta),
      { status: 500 }
    );
  }
}
