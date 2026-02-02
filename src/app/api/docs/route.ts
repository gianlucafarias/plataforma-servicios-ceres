import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

// Expose OpenAPI only in non-production to avoid leaking details.
const ALLOW_IN_PROD = process.env.ALLOW_API_DOCS === 'true';

export async function GET() {
  if (process.env.NODE_ENV === 'production' && !ALLOW_IN_PROD) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), 'docs', 'openapi-v1.yaml');
  const content = fs.readFileSync(filePath, 'utf8');

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'application/yaml',
      'Cache-Control': 'no-cache',
    },
  });
}
