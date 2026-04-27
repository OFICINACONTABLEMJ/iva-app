import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      );
    }

    // 🔥 extraer todos los uuid enviados
    const uuids = body.map((c: any) => c.uuid);

    // 🔥 buscar cuáles ya existen en DB
    const existentes = await prisma.compra.findMany({
      where: {
        uuid: { in: uuids },
      },
      select: { uuid: true },
    });

    const existentesSet = new Set(existentes.map(e => e.uuid));

    // 🔥 filtrar solo nuevos
    const nuevos = body.filter((c: any) => !existentesSet.has(c.uuid));

    if (nuevos.length === 0) {
      return NextResponse.json({
        ok: true,
        mensaje: "Todos los registros ya existían",
      });
    }

    // 🔥 insertar en lote
    await prisma.compra.createMany({
      data: nuevos,
      skipDuplicates: true,
    });

    return NextResponse.json({
      ok: true,
      insertados: nuevos.length,
    });

  } catch (error) {
    console.error("BATCH ERROR:", error);

    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 }
    );
  }
}