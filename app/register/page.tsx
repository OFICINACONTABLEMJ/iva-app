"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nit, setNit] = useState("");

  const [loading, setLoading] = useState(false);

  const register = async () => {
    if (loading) return;

    // =========================
    // 🔍 VALIDACIONES FRONTEND
    // =========================
    if (!nombre.trim() || !email.trim() || !password || !nit.trim()) {
      alert("Completa todos los campos");
      return;
    }

    if (password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Correo inválido");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim().toLowerCase(),
          password,
          nit: nit.trim().toUpperCase(), // 🔥 CLAVE
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error en el servidor");
        setLoading(false);
        return;
      }

      alert("Cuenta creada correctamente");
      router.push("/login");

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
          Crear cuenta
        </h1>

        {/* NOMBRE */}
        <input
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full p-2 rounded bg-white/20 border border-white/30 placeholder-white/70 mb-3 focus:outline-none focus:ring-2 focus:ring-white"
        />

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 rounded bg-white/20 border border-white/30 placeholder-white/70 mb-3 focus:outline-none focus:ring-2 focus:ring-white"
        />

        {/* NIT */}
        <input
          placeholder="NIT (Ej: 1234567-8)"
          value={nit}
          onChange={(e) => setNit(e.target.value)}
          className="w-full p-2 rounded bg-white/20 border border-white/30 placeholder-white/70 mb-3 focus:outline-none focus:ring-2 focus:ring-white"
        />

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded bg-white/20 border border-white/30 placeholder-white/70 mb-4 focus:outline-none focus:ring-2 focus:ring-white"
        />

        {/* BOTÓN */}
        <button
          onClick={register}
          disabled={loading}
          className={`w-full py-2 rounded mb-2 font-semibold transition ${
            loading
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-white text-indigo-600 hover:bg-gray-200"
          }`}
        >
          {loading ? "Creando..." : "Crear cuenta"}
        </button>

        {/* VOLVER */}
        <button
          onClick={() => router.push("/login")}
          className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition"
        >
          Volver al login
        </button>

      </div>
    </div>
  );
}