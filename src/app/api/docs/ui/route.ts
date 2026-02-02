import { NextResponse } from 'next/server';

const ALLOW_IN_PROD = process.env.ALLOW_API_DOCS === 'true';
const openApiUrl = process.env.NEXT_PUBLIC_OPENAPI_URL || '/api/docs';

export async function GET() {
  if (process.env.NODE_ENV === 'production' && !ALLOW_IN_PROD) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const html = /* html */ `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>CERES API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #0b1021; }
      #swagger-ui { max-width: 1200px; margin: 0 auto; padding: 16px; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        SwaggerUIBundle({
          url: '${openApiUrl}',
          dom_id: '#swagger-ui',
          presets: [SwaggerUIBundle.presets.apis],
          layout: "BaseLayout",
          deepLinking: true,
        });
      };
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
