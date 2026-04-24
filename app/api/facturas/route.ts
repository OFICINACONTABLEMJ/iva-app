import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SECRET = process.env.JWT_SECRET!;

// 🔐 función para obtener userId desde token
async function getUserIdFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, SECRET);
    return decoded.id;
  } catch {
    return null;
  }
}

// 🔹 OBTENER FACTURAS (solo del usuario logueado)
export async function GET() {
  try {
    const userId = await getUserIdFromToken();

    if (!userId) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const facturas = await prisma.factura.findMany({
      where: {
        usuarioId: userId, // 🔥 solo sus facturas
      },
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
    const userId = getUserIdFromToken();

    if (!userId) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const data = await req.json();

    const factura = await prisma.factura.create({
      data: {
        descripcion: data.descripcion,
        total: Number(data.total),
        base: Number(data.base),
        iva: Number(data.iva),
        categoria: data.categoria,
        tipo: data.tipo,
        emisorNIT: data.emisorNIT,
        receptorNIT: data.receptorNIT,
        mes: Number(data.mes),
        anio: Number(data.anio),
        deducible: data.deducible ?? true,

        // 🔥 relación correcta
        usuario: {
          connect: {
            id: userId,
          },
        },
      }
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