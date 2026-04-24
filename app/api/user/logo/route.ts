import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

const SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    // 🔐 USER
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, SECRET);
    const userId = decoded.id;

    // 📁 GUARDAR ARCHIVO
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `logo_${userId}_${Date.now()}.png`;
    const filePath = path.join(process.cwd(), "public/uploads", fileName);

    fs.writeFileSync(filePath, buffer);

    const url = `/uploads/${fileName}`;

    // 💾 GUARDAR EN BD
    await prisma.usuario.update({
      where: { id: userId },
      data: { logo: url },
    });

    return NextResponse.json({ logo: url });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error subiendo logo" }, { status: 500 });
  }
}