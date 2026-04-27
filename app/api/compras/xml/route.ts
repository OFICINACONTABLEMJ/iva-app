import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request) {
  try {
    const { mes, anio } = await req.json();
    const SECRET = process.env.JWT_SECRET!;

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

    // 🔥 BORRAR SOLO XML
    const deleted = await prisma.compra.deleteMany({
      where: {
        usuarioId: userId,
        mes: Number(mes),
        anio: Number(anio),
        descripcion: {
          startsWith: "[XML]",
        },
      },
    });

    return NextResponse.json({
      ok: true,
      eliminados: deleted.count,
    });

  } catch (error) {
    console.error("ERROR DELETE XML:", error);

    return NextResponse.json(
      { error: "Error interno al limpiar XML" },
      { status: 500 }
    );
  }
}