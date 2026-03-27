import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";
import { fail, requestMeta } from "@/lib/api-response";
import { PrivateDocumentError } from "@/lib/server/private-documents";
import { prisma } from "@/lib/prisma";
import { downloadCriminalRecordForProfessional } from "@/lib/server/professional-document-downloads";

export async function GET(request: NextRequest) {
  const meta = requestMeta(request);

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(fail("unauthorized", "No autorizado", undefined, meta), {
        status: 401,
      });
    }

    const professional = await prisma.professional.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!professional) {
      return NextResponse.json(fail("not_found", "Profesional no encontrado", undefined, meta), {
        status: 404,
      });
    }

    return downloadCriminalRecordForProfessional(professional.id);
  } catch (error) {
    if (error instanceof PrivateDocumentError) {
      return NextResponse.json(fail(error.code, error.message, undefined, meta), {
        status: error.status,
      });
    }

    console.error("Error descargando antecedentes del profesional:", error);
    return NextResponse.json(
      fail("server_error", "No se pudo descargar el documento.", undefined, meta),
      { status: 500 }
    );
  }
}
