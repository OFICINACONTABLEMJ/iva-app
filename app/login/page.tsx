"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/context/UserContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { setUser } = useUser();

  const login = async () => {
    if (loading) return;

    // =========================
    // 🔍 VALIDACIONES
    // =========================
    if (!email.trim() || !password) {
      alert("Ingresa correo y contraseña");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      // 🔥 TRAER USUARIO
      const resUser = await fetch("/api/auth/me", {
        credentials: "include",
      });

      const userData = await resUser.json();

      if (userData?.user) {
        setUser(userData.user);
      }

      router.push("/");

    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600">

      <div className="backdrop-blur-lg bg-white/10 border border-white/20 p-8 rounded-2xl shadow-2xl w-80 text-white">

        {/* LOGO */}
        <div className="flex justify-center mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/40 shadow-lg">
            <img src="/logo.png" className="w-full h-full object-cover" />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-4 text-center">
          Iniciar sesión
        </h1>

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
          className="w-full p-2 rounded bg-white/20 border border-white/30 placeholder-white/70 mb-3 focus:outline-none focus:ring-2 focus:ring-white"
        />

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
          className="w-full p-2 rounded bg-white/20 border border-white/30 placeholder-white/70 mb-4 focus:outline-none focus:ring-2 focus:ring-white"
        />

        {/* BOTÓN LOGIN */}
        <button
          onClick={login}
          disabled={loading}
          className={`w-full py-2 rounded mb-2 font-semibold transition ${
            loading
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-white text-indigo-600 hover:bg-gray-200"
          }`}
        >
          {loading ? "Entrando..." : "Iniciar sesión"}
        </button>

        {/* REGISTER */}
        <button
          onClick={() => router.push("/register")}
          className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition"
        >
          Crear cuenta
        </button>

      </div>
    </div>
  );
}