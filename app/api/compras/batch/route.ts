import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const SECRET = process.env.JWT_SECRET!;
    const body = await req.json(); // 👈 array

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Formato inválido" },
        { status: 400 }
      );
    }

    // 🍪 TOKEN
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

    // ============================
    // 🔥 NORMALIZAR DATA
    // ============================
    const data = body.map((item: any) => ({
      descripcion: item.descripcion,
      categoria: item.categoria,
      total: Number(item.total),
      base: Number(item.base),
      iva: Number(item.iva),
      mes: Number(item.mes),
      anio: Number(item.anio),

      usuarioId: userId,

      uuid: item.uuid || crypto.randomUUID(),
      uuidFactura: item.uuidFactura || item.uuid || crypto.randomUUID(),
      deducible: item.deducible ?? true,
    }));

    // ============================
    // 🔥 INSERT MASIVO
    // ============================
    const result = await prisma.compra.createMany({
      data,
      skipDuplicates: true, // 🔥 CLAVE
    });

    return NextResponse.json({
      ok: true,
      inserted: result.count,
    });

  } catch (error) {
    console.error("❌ ERROR BATCH:", error);

    return NextResponse.json(
      { error: "Error en carga masiva" },
      { status: 500 }
    );
  }
}