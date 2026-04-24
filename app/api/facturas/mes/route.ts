import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const mes = Number(searchParams.get("mes"));
    const anio = Number(searchParams.get("anio"));

    const facturas = await prisma.factura.findMany({
      where: {
        mes,
        anio,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(facturas);
  } catch (error) {
    return NextResponse.json(
      { error: "Error obteniendo facturas por mes" },
      { status: 500 }
    );
  }
}