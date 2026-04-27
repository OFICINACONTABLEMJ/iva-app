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
      uuid,
      uuidFactura,
      deducible,
      clienteId,
    } = body;

    // 🍪 COOKIE
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 🔐 JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, SECRET);
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const userId = decoded.id;

    // ============================
    // 🔒 BLOQUEO DE MES
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
        { error: "Mes bloqueado" },
        { status: 403 }
      );
    }

    // ============================
    // 🔥 NORMALIZACIÓN SEGURA
    // ============================
    const safeUUID = uuid || crypto.randomUUID();
    const safeUUIDFactura = uuidFactura || safeUUID;
    const safeDeducible = deducible ?? true;

    // ============================
    // 🔁 DUPLICADO ITEM
    // ============================
    const existeItem = await prisma.compra.findFirst({
      where: {
        uuid: safeUUID,
        usuarioId: userId,
      },
    });

    if (existeItem) {
      return NextResponse.json(
        { error: "Item XML duplicado" },
        { status: 400 }
      );
    }

    // ============================
    // 🔥 DUPLICADO FACTURA (PRO)
    // ============================
    const existeFactura = await prisma.compra.findFirst({
      where: {
        uuidFactura: safeUUIDFactura,
        usuarioId: userId,
      },
    });

    if (existeFactura) {
      return NextResponse.json(
        { error: "Factura ya registrada" },
        { status: 400 }
      );
    }

    // ============================
    // ✅ CREAR
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

        uuid: safeUUID,
        uuidFactura: safeUUIDFactura,
        deducible: safeDeducible,
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