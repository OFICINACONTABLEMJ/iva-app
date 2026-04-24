import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!;

// ==========================
// 🔒 GUARDAR Y BLOQUEAR MES
// ==========================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mes, anio, ventas, debito, credito, iva, retenciones } = body;

    // 🍪 TOKEN
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 🔐 VALIDAR TOKEN
    let decoded: any;
    try {
      decoded = jwt.verify(token, SECRET);
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const userId = decoded.id;

    // 🔒 VERIFICAR SI YA ESTÁ BLOQUEADO
    const yaBloqueado = await prisma.mesCerrado.findUnique({
      where: {
        usuarioId_mes_anio: {
          usuarioId: userId,
          mes,
          anio,
        },
      },
    });

    if (yaBloqueado) {
      return NextResponse.json(
        { error: "Este mes ya está bloqueado" },
        { status: 400 }
      );
    }

    // 🔒 CREAR BLOQUEO
    await prisma.mesCerrado.create({
      data: {
        usuarioId: userId,
        mes,
        anio,
      },
    });

    // 💾 GUARDAR RESUMEN
    await prisma.resumen.upsert({
      where: {
        userId_mes_anio: {
          userId,
          mes,
          anio,
        },
      },
      update: {
        ventas,
        debito,
        credito,
        iva,
        retenciones,
        bloqueado: true,
      },
      create: {
        userId,
        mes,
        anio,
        ventas,
        debito,
        credito,
        iva,
        retenciones,
        bloqueado: true,
      },
    });

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("ERROR POST /resumen:", error);
    return NextResponse.json(
      { error: "Error al guardar resumen" },
      { status: 500 }
    );
  }
}

// ==========================
// 📊 OBTENER RESUMEN
// ==========================
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const mes = Number(searchParams.get("mes"));
    const anio = Number(searchParams.get("anio"));

    // 🍪 TOKEN
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 🔐 VALIDAR TOKEN
    let decoded: any;
    try {
      decoded = jwt.verify(token, SECRET);
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const userId = decoded.id;

    // 📊 RESUMEN
    const resumen = await prisma.resumen.findFirst({
      where: { userId, mes, anio },
    });

    // 🔒 VERIFICAR BLOQUEO
    const bloqueado = await prisma.mesCerrado.findUnique({
      where: {
        usuarioId_mes_anio: {
          usuarioId: userId,
          mes,
          anio,
        },
      },
    });

    return NextResponse.json({
      ...(resumen || {}),
      bloqueado: !!bloqueado, // 🔥 CLAVE
    });

  } catch (error) {
    console.error("ERROR GET /resumen:", error);
    return NextResponse.json(
      { error: "Error al obtener resumen" },
      { status: 500 }
    );
  }
}