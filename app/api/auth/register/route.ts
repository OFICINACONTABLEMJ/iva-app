import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { nombre, email, password } = await req.json();

    // 🔒 validar campos
    if (!nombre || !email || !password) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }

    // 🔍 verificar si ya existe
    const existe = await prisma.usuario.findUnique({
      where: { email },
    });

    if (existe) {
      return NextResponse.json(
        { error: "Este correo ya está registrado" },
        { status: 400 }
      );
    }

    // 🔐 hash password
    const hash = await bcrypt.hash(password, 10);

    // 💾 crear usuario
    const user = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hash,
      },
    });

    return NextResponse.json({ ok: true, user });

  } catch (error) {
    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 }
    );
  }
}