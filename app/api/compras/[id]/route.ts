import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!;

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    // 🍪 TOKEN
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // 🔐 VALIDAR TOKEN
    let decoded: any;

    try {
      decoded = jwt.verify(token, SECRET);
    } catch {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    // 🔍 BUSCAR COMPRA
    const compra = await prisma.compra.findUnique({
      where: { id },
    });

    if (!compra || compra.usuarioId !== userId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    // ============================
    // 🔒 VERIFICAR BLOQUEO DE MES
    // ============================
    const bloqueado = await prisma.mesCerrado.findUnique({
      where: {
        usuarioId_mes_anio: {
          usuarioId: userId,
          mes: compra.mes,
          anio: compra.anio,
        },
      },
    });

    if (bloqueado) {
      return NextResponse.json(
        { error: "Mes bloqueado, no puedes eliminar compras" },
        { status: 403 }
      );
    }

    // ============================
    // 🗑 ELIMINAR
    // ============================
    await prisma.compra.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("ERROR DELETE:", error);

    return NextResponse.json(
      { error: "Error al eliminar" },
      { status: 500 }
    );
  }
}