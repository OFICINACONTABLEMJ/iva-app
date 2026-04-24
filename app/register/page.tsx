"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const register = async () => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nombre, email, password }),
    });

    const data = await res.json();

    if (data.ok) {
      alert("Cuenta creada correctamente");
      router.push("/login");
    } else {
      alert(data.error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600">

      {/* 🔥 CARD GLASS */}
      <div className="backdrop-blur-lg bg-white/10 border border-white/20 p-8 rounded-2xl shadow-2xl w-80 text-white">

        {/* 🔥 LOGO CIRCULAR */}
        <div className="flex justify-center mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/40 shadow-lg hover:scale-105 transition">
            <img
              src="/logo.png"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-4 text-center">
          Crear cuenta
        </h1>

        {/* NOMBRE */}
        <input
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full p-2 rounded bg-white/20 border border-white/30 placeholder-white/70 text-white mb-3 focus:outline-none focus:ring-2 focus:ring-white"
        />

        {/* EMAIL */}
        <input
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 rounded bg-white/20 border border-white/30 placeholder-white/70 text-white mb-3 focus:outline-none focus:ring-2 focus:ring-white"
        />

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded bg-white/20 border border-white/30 placeholder-white/70 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-white"
        />

        {/* BOTÓN REGISTRAR */}
        <button
          onClick={register}
          className="w-full bg-white text-indigo-600 font-semibold py-2 rounded mb-2 hover:bg-gray-200 transition"
        >
          Crear cuenta
        </button>

        {/* VOLVER A LOGIN */}
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