import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    return NextResponse.json({ exists: !!user });
  } catch (error) {
    console.error("Error en check-email (GET):", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    return NextResponse.json({ exists: !!user });
  } catch (error) {
    console.error("Error en check-email (POST):", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}