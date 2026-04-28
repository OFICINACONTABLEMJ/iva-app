import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!;

// ==========================
// 🔐 OBTENER USUARIO
// ==========================
async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) return null;

  try {
    return jwt.verify(token, SECRET) as any;
  } catch {
    return null;
  }
}

// ==========================
// 🔒 POST → GUARDAR + BLOQUEAR MES
// ==========================
export async function POST(req: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();

    const {
      mes,
      anio,
      ventas,
      debito,
      credito,
      iva,
      retenciones,
      clienteId, // 🔥 NUEVO
    } = body;

    // 🔥 VALIDACIONES
    if (!mes || !anio) {
      return NextResponse.json(
        { error: "Mes y año son requeridos" },
        { status: 400 }
      );
    }

    const mesNum = Number(mes);
    const anioNum = Number(anio);

    const userId = user.id;

    // ==========================
    // 🔒 VERIFICAR BLOQUEO
    // ==========================
    const yaBloqueado = await prisma.mesCerrado.findUnique({
      where: {
        usuarioId_mes_anio: {
          usuarioId: userId,
          mes: mesNum,
          anio: anioNum,
        },
      },
    });

    if (yaBloqueado) {
      return NextResponse.json(
        { error: "Este mes ya está bloqueado" },
        { status: 400 }
      );
    }

    // ==========================
    // 🔥 VALIDAR CLIENTE (CLAVE)
    // ==========================
    let clienteValido = null;

    if (clienteId) {
      clienteValido = await prisma.cliente.findUnique({
        where: { id: clienteId },
      });

      if (!clienteValido || clienteValido.usuarioId !== userId) {
        return NextResponse.json(
          { error: "Cliente inválido" },
          { status: 400 }
        );
      }
    }

    // ==========================
    // 🔒 CREAR BLOQUEO
    // ==========================
    await prisma.mesCerrado.create({
      data: {
        usuarioId: userId,
        mes: mesNum,
        anio: anioNum,
      },
    });

    // ==========================
    // 💾 GUARDAR RESUMEN
    // ==========================
    const resumen = await prisma.resumen.upsert({
      where: {
        userId_mes_anio: {
          userId,
          mes: mesNum,
          anio: anioNum,
        },
      },
      update: {
        ventas: Number(ventas) || 0,
        debito: Number(debito) || 0,
        credito: Number(credito) || 0,
        iva: Number(iva) || 0,
        retenciones: Number(retenciones) || 0,
        bloqueado: true,
        clienteId: clienteId || null, // 🔥 CLAVE
      },
      create: {
        userId,
        mes: mesNum,
        anio: anioNum,
        ventas: Number(ventas) || 0,
        debito: Number(debito) || 0,
        credito: Number(credito) || 0,
        iva: Number(iva) || 0,
        retenciones: Number(retenciones) || 0,
        bloqueado: true,
        clienteId: clienteId || null, // 🔥 CLAVE
      },
    });

    return NextResponse.json(resumen);

  } catch (error) {
    console.error("ERROR POST /resumen:", error);

    return NextResponse.json(
      { error: "Error al guardar resumen" },
      { status: 500 }
    );
  }
}

// ==========================
// 📊 GET → OBTENER RESUMEN
// ==========================
export async function GET(req: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const mes = Number(searchParams.get("mes"));
    const anio = Number(searchParams.get("anio"));

    if (!mes || !anio) {
      return NextResponse.json(
        { error: "Mes y año requeridos" },
        { status: 400 }
      );
    }

    const userId = user.id;

    // ==========================
    // 📊 RESUMEN + CLIENTE 🔥
    // ==========================
    const resumen = await prisma.resumen.findFirst({
      where: { userId, mes, anio },
      include: {
        cliente: true, // 🔥 CLAVE PARA PDF
      },
    });

    // ==========================
    // 🔒 VERIFICAR BLOQUEO
    // ==========================
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
      bloqueado: !!bloqueado,
    });

  } catch (error) {
    console.error("ERROR GET /resumen:", error);

    return NextResponse.json(
      { error: "Error al obtener resumen" },
      { status: 500 }
    );
  }
}