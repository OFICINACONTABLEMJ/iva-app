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

    await prisma.compra.createMany({
      data: body,
      skipDuplicates: true,
    });

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("BATCH ERROR:", error);

    return NextResponse.json(
      { error: "Error al guardar compras" },
      { status: 500 }
    );
  }
}