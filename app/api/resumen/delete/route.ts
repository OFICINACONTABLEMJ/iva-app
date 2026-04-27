import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!;

export async function DELETE(req: Request) {
  try {
    const { mes, anio } = await req.json();

    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, SECRET);
    const userId = decoded.id;

    // 🔥 BORRAR COMPRAS
    await prisma.compra.deleteMany({
      where: {
        usuarioId: userId,
        mes,
        anio,
      },
    });

    // 🔥 BORRAR RESUMEN
    await prisma.resumen.deleteMany({
      where: {
        userId: userId,
        mes,
        anio,
      },
    });

    // 🔥 BORRAR BLOQUEO (SI EXISTE)
    await prisma.mesCerrado.deleteMany({
      where: {
        usuarioId: userId,
        mes,
        anio,
      },
    });

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al borrar" }, { status: 500 });
  }
}