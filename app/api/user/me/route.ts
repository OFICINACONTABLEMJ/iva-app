import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers"; // 🔥 ESTA LÍNEA FALTABA
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json(null);
    }

    const decoded: any = jwt.verify(token, SECRET);

    const user = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        nombre: true,
        logo: true,
      },
    });

    return NextResponse.json(user);

  } catch (error) {
    console.error(error);
    return NextResponse.json(null);
  }
}