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

    const { nombre, email, password, nit } = data;

    // =========================
    // 🔹 LIMPIAR DATOS
    // =========================
    const nombreClean = (nombre || "").trim();
    const emailClean = (email || "").trim().toLowerCase();
    const nitClean = (nit || "").trim().toUpperCase();

    // =========================
    // 🔹 VALIDACIONES
    // =========================
    if (!nombreClean || !emailClean || !password || !nitClean) {
      return NextResponse.json(
        { error: "Faltan campos" },
        { status: 400 }
      );
    }

    // 🔹 EMAIL
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailClean)) {
      return NextResponse.json(
        { error: "Correo inválido" },
        { status: 400 }
      );
    }

    // 🔹 PASSWORD
    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // 🔹 NIT (validación básica Guatemala)
    const nitRegex = /^[0-9]+(-?[0-9kK])?$/;
    if (!nitRegex.test(nitClean)) {
      return NextResponse.json(
        { error: "NIT inválido" },
        { status: 400 }
      );
    }

    // =========================
    // 🔍 VERIFICAR DUPLICADOS
    // =========================
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

    // =========================
    // 🔐 ENCRIPTAR PASSWORD
    // =========================
    const hashedPassword = await bcrypt.hash(password, 10);

    // =========================
    // 🔥 CREAR USUARIO
    // =========================
    const user = await prisma.usuario.create({
      data: {
        nombre: nombreClean,
        email: emailClean,
        password: hashedPassword,
        nit: nitClean, // 🔥 CLAVE
      },
    });

    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error("REGISTER ERROR:", error);

    // 🔥 ERROR DE PRISMA (unique constraint)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "El correo ya existe" },
        { status: 400 }
      );
    }

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