import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// ============================
// 🔐 OBTENER USUARIO
// ============================
async function getUser() {
  const SECRET = process.env.JWT_SECRET!;
  const token = (await cookies()).get("session")?.value;

  if (!token) return null;

  try {
    return jwt.verify(token, SECRET) as any;
  } catch {
    return null;
  }
}

// ============================
// 🔧 NORMALIZAR NIT (PRO)
// ============================
function normalizeNIT(nit: string) {
  return nit
    .replace(/[^0-9Kk]/g, "") // 🔥 deja solo números y K
    .toUpperCase()
    .trim();
}

// ============================
// 📥 GET → LISTAR CLIENTES
// ============================
export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const clientes = await prisma.cliente.findMany({
      where: { usuarioId: user.id },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json(clientes);

  } catch (error) {
    console.error("ERROR GET CLIENTES:", error);
    return NextResponse.json(
      { error: "Error al obtener clientes" },
      { status: 500 }
    );
  }
}

// ============================
// 📤 POST → CREAR CLIENTE
// ============================
export async function POST(req: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await req.json();

    const nombre = (data.nombre || "").trim();
    const nit = normalizeNIT(data.nit || "");

    // 🔍 VALIDACIONES
    if (!nombre || !nit) {
      return NextResponse.json(
        { error: "Nombre y NIT son obligatorios" },
        { status: 400 }
      );
    }

    // 🔍 VALIDACIÓN FORMATO NIT
    const nitRegex = /^[0-9]+K?$/;
    if (!nitRegex.test(nit)) {
      return NextResponse.json(
        { error: "NIT inválido" },
        { status: 400 }
      );
    }

    // 🔍 DUPLICADO
    const existe = await prisma.cliente.findFirst({
      where: {
        usuarioId: user.id,
        nit,
      },
    });

    if (existe) {
      return NextResponse.json(
        { error: "Cliente ya existe" },
        { status: 400 }
      );
    }

    const cliente = await prisma.cliente.create({
      data: {
        nombre,
        nit,
        usuarioId: user.id,
      },
    });

    return NextResponse.json(cliente);

  } catch (error: any) {
    console.error("ERROR CREATE CLIENTE:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Cliente duplicado" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 }
    );
  }
}

// ============================
// 🗑 DELETE → ELIMINAR CLIENTE
// ============================
export async function DELETE(req: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID requerido" },
        { status: 400 }
      );
    }

    // 🔐 VALIDAR PROPIEDAD
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: { compras: true },
    });

    if (!cliente || cliente.usuarioId !== user.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    // 🔥 PROTECCIÓN IMPORTANTE
    if (cliente.compras.length > 0) {
      return NextResponse.json(
        { error: "No puedes eliminar un cliente con compras registradas" },
        { status: 400 }
      );
    }

    await prisma.cliente.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("ERROR DELETE CLIENTE:", error);
    return NextResponse.json(
      { error: "Error al eliminar cliente" },
      { status: 500 }
    );
  }
}