import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
const { searchParams } = new URL(req.url);

const mes = Number(searchParams.get("mes"));
const anio = Number(searchParams.get("anio"));

const data = await prisma.resumen.findMany({
where: { mes, anio },
orderBy: { createdAt: "desc" },
});

return NextResponse.json(data);
}