import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Limpiar cookies
    const cookieStore = await cookies();
    cookieStore.delete('accessToken');
    cookieStore.delete('refreshToken');

    return NextResponse.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'logout_failed',
        message: 'Error al cerrar sesión',
      },
      { status: 500 }
    );
  }
}
