import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const SECRET = process.env.JWT_SECRET!;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    let decoded: any;

    try {
      decoded = jwt.verify(token, SECRET);
    } catch {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    // 🔥 DEVOLVER TODO EL USUARIO (RECOMENDADO)
    return NextResponse.json({ user });

  } catch (error) {
    console.error("ERROR /me:", error);

    return NextResponse.json(
      { user: null, error: "Error al obtener usuario" },
      { status: 500 }
    );
  }
}