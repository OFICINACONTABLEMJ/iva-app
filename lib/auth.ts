import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!;

export function getUserFromToken() {
  const cookieStore = cookies() as any; // 🔥 fix TS
  const token = cookieStore.get("session")?.value;

  if (!token) return null;

  try {
    return jwt.verify(token, SECRET) as {
      id: string;
      email: string;
      nombre: string;
    };
  } catch {
    return null;
  }
}