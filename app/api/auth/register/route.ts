import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    let data;

    // 🔹 Leer JSON seguro
    try {
      data = await req.json();
    } catch (e) {
      console.error("JSON ERROR:", e);
      return NextResponse.json(
        { error: "Error leyendo datos" },
        { status: 400 }
      );
    }

    const { nombre, email, password } = data;

    // 🔹 LIMPIAR DATOS
    const nombreClean = (nombre || "").trim();
    const emailClean = (email || "").trim().toLowerCase();

    // 🔹 VALIDACIÓN CAMPOS
    if (!nombreClean || !emailClean || !password) {
      return NextResponse.json(
        { error: "Faltan campos" },
        { status: 400 }
      );
    }

    // 🔹 VALIDAR FORMATO EMAIL
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(emailClean)) {
      return NextResponse.json(
        { error: "Correo inválido" },
        { status: 400 }
      );
    }

    // 🔹 VALIDAR PASSWORD (opcional pero recomendado)
    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // 🔍 VERIFICAR SI YA EXISTE (CASE INSENSITIVE)
    const existingUser = await prisma.usuario.findFirst({
      where: {
        email: emailClean,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "El correo ya está en uso" },
        { status: 400 }
      );
    }

    // 🔐 ENCRIPTAR PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔥 CREAR USUARIO
    const user = await prisma.usuario.create({
      data: {
        nombre: nombreClean,
        email: emailClean,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

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