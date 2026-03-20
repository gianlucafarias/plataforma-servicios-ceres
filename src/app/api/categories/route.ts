import { NextResponse } from 'next/server';
import { getPublicCategoryTree } from '@/lib/server/categories';

export async function GET() {
  try {
    const data = await getPublicCategoryTree();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error obteniendo categorias:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al obtener categorias' },
      { status: 500 }
    );
  }
}
