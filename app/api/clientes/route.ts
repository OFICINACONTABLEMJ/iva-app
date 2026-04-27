import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// ============================
// 🔐 OBTENER USUARIO DESDE COOKIE
// ============================
async function getUser() {
  const SECRET = process.env.JWT_SECRET!;

  const token = (await cookies()).get("session")?.value;

  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, SECRET);
    return decoded;
  } catch {
    return null;
  }
}

// ============================
// 📥 GET → LISTAR CLIENTES
// ============================
export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const clientes = await prisma.cliente.findMany({
      where: {
        usuarioId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
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
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const data = await req.json();

    const nombre = (data.nombre || "").trim();
    const nit = (data.nit || "").trim().toUpperCase();

    // 🔍 VALIDACIONES
    if (!nombre || !nit) {
      return NextResponse.json(
        { error: "Nombre y NIT son obligatorios" },
        { status: 400 }
      );
    }

    // 🔍 EVITAR DUPLICADOS POR NIT
    const existe = await prisma.cliente.findFirst({
      where: {
        nit,
        usuarioId: user.id,
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

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error en el servidor",
      },
      { status: 500 }
    );
  }
}