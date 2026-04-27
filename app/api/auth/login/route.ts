import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// 🔥 USA EL MISMO SECRET EN TODA LA APP
const SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // 🔍 BUSCAR USUARIO
    const user = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no existe" },
        { status: 400 }
      );
    }

    // 🔐 VALIDAR PASSWORD
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return NextResponse.json(
        { error: "Contraseña incorrecta" },
        { status: 400 }
      );
    }

    // 🔐 GENERAR TOKEN
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
      },
      SECRET,
      { expiresIn: "1d" }
    );

    const res = NextResponse.json({ ok: true });

    // 🍪 GUARDAR COOKIE (🔥 CLAVE)
    res.cookies.set("session", token, {
  httpOnly: true,
  secure: true, // 🔥 SIEMPRE true en producción
  sameSite: "none", // 🔥 CLAVE
  path: "/",
  maxAge: 60 * 60 * 24,
});

    return res;

  } catch (error) {
    console.error("ERROR LOGIN:", error);

    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 }
    );
  }
}