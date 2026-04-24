import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const SECRET = process.env.JWT_SECRET!;

    const {
      descripcion,
      categoria,
      total,
      base,
      iva,
      mes,
      anio,
      uuid, // 🔥 UUID XML
    } = body;

    // 🍪 OBTENER TOKEN
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

    // ============================
    // 🔒 BLOQUEO DE MES (CLAVE)
    // ============================
    const bloqueado = await prisma.mesCerrado.findUnique({
      where: {
        usuarioId_mes_anio: {
          usuarioId: userId,
          mes: Number(mes),
          anio: Number(anio),
        },
      },
    });

    if (bloqueado) {
      return NextResponse.json(
        { error: "Mes bloqueado, no puedes agregar compras" },
        { status: 403 }
      );
    }

    // ============================
    // 🔁 VALIDAR DUPLICADO XML
    // ============================
    if (uuid) {
      const existe = await prisma.compra.findFirst({
        where: {
          uuid,
          usuarioId: userId,
        },
      });

      if (existe) {
        return NextResponse.json(
          { error: "XML ya registrado" },
          { status: 400 }
        );
      }
    }

    // ============================
    // ✅ CREAR COMPRA
    // ============================
    const compra = await prisma.compra.create({
      data: {
        descripcion,
        categoria,
        total: Number(total),
        base: Number(base),
        iva: Number(iva),
        mes: Number(mes),
        anio: Number(anio),
        usuarioId: userId,
        uuid,
      },
    });

    return NextResponse.json(compra);

  } catch (error) {
    console.error("ERROR CREAR COMPRA:", error);

    return NextResponse.json(
      { error: "Error al guardar compra" },
      { status: 500 }
    );
  }
}