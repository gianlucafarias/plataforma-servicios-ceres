import { NextResponse } from "next/server";
import { fail, requestMeta } from "@/lib/api-response";
import { UploadFlowError, createPublicUploadResponse } from "@/lib/server/uploads";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ objectKey: string[] }> }
) {
  const meta = requestMeta(request);

  try {
    const { objectKey } = await params;
    return await createPublicUploadResponse({
      objectKey: objectKey.join("/"),
    });
  } catch (error) {
    if (error instanceof UploadFlowError) {
      return NextResponse.json(fail(error.code, error.message, undefined, meta), {
        status: error.status,
      });
    }

    console.error("Error serving public upload:", error);
    return NextResponse.json(
      fail("server_error", "No se pudo obtener el archivo.", undefined, meta),
      { status: 500 }
    );
  }
}
