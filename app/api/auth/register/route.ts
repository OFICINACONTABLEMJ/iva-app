import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    let data;

    try {
      data = await req.json();
    } catch (e) {
      console.error("JSON ERROR:", e);
      return NextResponse.json(
        { error: "Error leyendo datos" },
        { status: 400 }
      );
    }

    console.log("DATA:", data);

    const { nombre, email, password } = data;

    if (!nombre || !email || !password) {
      return NextResponse.json(
        { error: "Faltan campos" },
        { status: 400 }
      );
    }

    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json(user);

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 }
    );
  }
}