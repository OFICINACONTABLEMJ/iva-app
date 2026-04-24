import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, SECRET);
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const userId = decoded.id;

    const data = await prisma.resumen.findMany({
      where: { userId },
      orderBy: { mes: "asc" },
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al obtener datos" }, { status: 500 });
  }
}