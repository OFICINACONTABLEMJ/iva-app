import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 🔹 OBTENER FACTURAS
export async function GET() {
  try {
    const facturas = await prisma.factura.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(facturas);
  } catch (error) {
    return NextResponse.json(
      { error: "Error obteniendo facturas" },
      { status: 500 }
    );
  }
}

// 🔹 GUARDAR FACTURA
export async function POST(req: Request) {
  try {
    const data = await req.json();

    const factura = await prisma.factura.create({
      data: {
        descripcion: data.descripcion,
        total: data.total,
        base: data.base,
        iva: data.iva,
        categoria: data.categoria,
        tipo: data.tipo,
        emisorNIT: data.emisorNIT,
        receptorNIT: data.receptorNIT,
        mes: data.mes,
        anio: data.anio,
        deducible: data.deducible ?? true,
      },
    });

    return NextResponse.json(factura);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error guardando factura" },
      { status: 500 }
    );
  }
}