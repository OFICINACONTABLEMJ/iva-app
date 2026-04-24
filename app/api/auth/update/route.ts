import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!;

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const {
      nombre,
      email,
      password,
      newPassword,
      avatar, // 🔥 IMPORTANTE
    } = body;

    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let decoded: any;

    try {
      decoded = jwt.verify(token, SECRET);
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const userId = decoded.id;

    const user = await prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const nombreClean = (nombre || "").trim();
const emailClean = (email || "").toLowerCase().trim();

    // 🚨 DEBUG CLAVE
    console.log("AVATAR RECIBIDO:", avatar);

    // 🔥 DATA FINAL (AQUÍ ESTABA EL ERROR)
    let dataToUpdate: any = {
      nombre,
      email: emailClean,
      avatar: avatar, // 🔥 FORZAMOS GUARDADO SIEMPRE
    };

    // 🔐 CAMBIO DE PASSWORD
    if (newPassword) {
      if (!password) {
        return NextResponse.json(
          { error: "Debes ingresar tu contraseña actual" },
          { status: 400 }
        );
      }

      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
        return NextResponse.json(
          { error: "Contraseña incorrecta" },
          { status: 400 }
        );
      }

      const hash = await bcrypt.hash(newPassword, 10);
      dataToUpdate.password = hash;
    }

    // 💾 UPDATE FINAL
    const updatedUser = await prisma.usuario.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    console.log("USUARIO ACTUALIZADO:", updatedUser);

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("ERROR BACKEND UPDATE:", error);

    return NextResponse.json(
      { error: "Error al actualizar perfil" },
      { status: 500 }
    );
  }
}