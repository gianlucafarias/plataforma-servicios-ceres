import { NextRequest, NextResponse } from "next/server";
import { fail, ok, requestMeta } from "@/lib/api-response";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit-memory";
import { clientIp } from "@/lib/request-helpers";
import {
  PRIVATE_DOCUMENT_GRANT_RATE_LIMIT,
  PrivateDocumentError,
  createPrivateDocumentUploadGrantFromPayload,
} from "@/lib/server/private-documents";

export async function POST(request: NextRequest) {
  const meta = requestMeta(request);
  const rl = rateLimit(
    `v1:documents-upload-grant:${clientIp(request)}`,
    PRIVATE_DOCUMENT_GRANT_RATE_LIMIT.limit,
    PRIVATE_DOCUMENT_GRANT_RATE_LIMIT.windowMs
  );

  if (!rl.allowed) {
    return NextResponse.json(
      fail("rate_limited", "Demasiadas solicitudes. Intenta mas tarde.", undefined, meta),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const grant = createPrivateDocumentUploadGrantFromPayload(await request.json());

    return NextResponse.json(
      ok(
        {
          token: grant.token,
          expiresAt: grant.expiresAt,
        },
        meta
      ),
      { headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    if (error instanceof PrivateDocumentError) {
      return NextResponse.json(fail(error.code, error.message, undefined, meta), {
        status: error.status,
        headers: rateLimitHeaders(rl),
      });
    }

    console.error("Error creando upload grant privado:", error);
    return NextResponse.json(
      fail("server_error", "No se pudo generar el token de upload.", undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}
