import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";
import { fail, ok, requestMeta } from "@/lib/api-response";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit-memory";
import { clientIp } from "@/lib/request-helpers";
import {
  PRIVATE_DOCUMENT_UPLOAD_RATE_LIMIT,
  PrivateDocumentError,
  processPrivateDocumentUpload,
} from "@/lib/server/private-documents";

export async function POST(request: NextRequest) {
  const meta = requestMeta(request);
  const rl = rateLimit(
    `v1:documents-upload:${clientIp(request)}`,
    PRIVATE_DOCUMENT_UPLOAD_RATE_LIMIT.limit,
    PRIVATE_DOCUMENT_UPLOAD_RATE_LIMIT.windowMs
  );

  if (!rl.allowed) {
    return NextResponse.json(
      fail("rate_limited", "Demasiadas solicitudes. Intenta mas tarde.", undefined, meta),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const data = await request.formData();
    const session = await getServerSession(authOptions);
    const upload = await processPrivateDocumentUpload({
      file: data.get("file") as File | null,
      sessionUserId: session?.user?.id,
      uploadGrantToken: request.headers.get("x-upload-token"),
    });

    return NextResponse.json(ok(upload, meta), {
      status: 201,
      headers: rateLimitHeaders(rl),
    });
  } catch (error) {
    if (error instanceof PrivateDocumentError) {
      return NextResponse.json(fail(error.code, error.message, undefined, meta), {
        status: error.status,
        headers: rateLimitHeaders(rl),
      });
    }

    console.error("Error subiendo documento privado:", error);
    return NextResponse.json(
      fail("server_error", "No se pudo subir el documento.", undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}
