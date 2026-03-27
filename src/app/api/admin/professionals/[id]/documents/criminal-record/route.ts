import { NextRequest, NextResponse } from "next/server";
import { fail, requestMeta } from "@/lib/api-response";
import { requireAdminApiKey } from "@/lib/auth-helpers";
import { PrivateDocumentError } from "@/lib/server/private-documents";
import { downloadCriminalRecordForProfessional } from "@/lib/server/professional-document-downloads";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const meta = requestMeta(request);
  const { error } = requireAdminApiKey(request);
  if (error) {
    return error;
  }

  try {
    const { id } = await params;
    return downloadCriminalRecordForProfessional(id);
  } catch (err) {
    if (err instanceof PrivateDocumentError) {
      return NextResponse.json(fail(err.code, err.message, undefined, meta), {
        status: err.status,
      });
    }

    console.error("Error descargando antecedentes para admin:", err);
    return NextResponse.json(
      fail("server_error", "No se pudo descargar el documento.", undefined, meta),
      { status: 500 }
    );
  }
}
