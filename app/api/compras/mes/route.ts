import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mes = Number(searchParams.get("mes"));
    const anio = Number(searchParams.get("anio"));

    if (!mes || !anio) {
      return NextResponse.json(
        { error: "Mes o año inválido" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

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

    const compras = await prisma.compra.findMany({
      where: {
        usuarioId: userId,
        mes,
        anio,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(compras);

  } catch (error) {
    console.error("ERROR OBTENER COMPRAS:", error);
    return NextResponse.json(
      { error: "Error al obtener compras" },
      { status: 500 }
    );
  }
}