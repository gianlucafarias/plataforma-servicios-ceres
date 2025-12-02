import { NextRequest, NextResponse } from 'next/server'

/**
 * Valida que la petición venga del dashboard de admin verificando el API Key
 */
export function requireAdminApiKey(request: NextRequest) {
    const apiKey = request.headers.get('x-admin-api-key') || 
                   request.headers.get('authorization')?.replace('Bearer ', '');
  
    if (!apiKey) {
      return {
        error: NextResponse.json(
          { 
            success: false, 
            error: 'unauthorized', 
            message: 'API Key requerida. Incluye el header x-admin-api-key o Authorization: Bearer <key>' 
          },
          { status: 401 }
        ),
        authorized: false,
      };
    }
  
    // Validar contra la API Key configurada
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return {
        error: NextResponse.json(
          { 
            success: false, 
            error: 'forbidden', 
            message: 'API Key inválida' 
          },
          { status: 403 }
        ),
        authorized: false,
      };
    }
  
    return { error: null, authorized: true };
  }
  
  /**
   * Opcional: Permitir múltiples API Keys si tienes varios servicios
   */
  export function requireApiKey(request: NextRequest, allowedKeys?: string[]) {
    const apiKey = request.headers.get('x-api-key') || 
                   request.headers.get('authorization')?.replace('Bearer ', '');
  
    if (!apiKey) {
      return {
        error: NextResponse.json(
          { success: false, error: 'unauthorized', message: 'API Key requerida' },
          { status: 401 }
        ),
        authorized: false,
      };
    }
  
    const keys = allowedKeys || [process.env.ADMIN_API_KEY as string];
    
    if (!keys.includes(apiKey)) {
      return {
        error: NextResponse.json(
          { success: false, error: 'forbidden', message: 'API Key inválida' },
          { status: 403 }
        ),
        authorized: false,
      };
    }
  
    return { error: null, authorized: true };
  }