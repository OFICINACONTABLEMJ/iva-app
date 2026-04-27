import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  const SECRET = process.env.JWT_SECRET!;
  const { nombre, nit } = await req.json();

  const token = (await cookies()).get("session")?.value;

  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const decoded: any = jwt.verify(token, SECRET);

  const cliente = await prisma.cliente.create({
    data: {
      nombre,
      nit,
      usuarioId: decoded.id,
    },
  });

  return NextResponse.json(cliente);
}