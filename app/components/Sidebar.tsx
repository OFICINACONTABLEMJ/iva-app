"use client";

import { useRouter, usePathname } from "next/navigation";
import { useUser } from "../context/UserContext";

export default function Sidebar() {  // 👈 ESTO ES CLAVE
  const router = useRouter();
  const pathname = usePathname();
  const { setUser } = useUser();

  const menu = [
    { name: "Inicio", path: "/", icon: "🏠" },
    { name: "Dashboard", path: "/dashboard", icon: "📊" },
    { name: "Historial", path: "/historial", icon: "📁" },
    { name: "Perfil", path: "/perfil", icon: "👤" },
    { name: "Diseño facturas", path: "/diseno-facturas", icon: "🧾" },
  ];

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
  };

  return (
    <div className="w-64 bg-white shadow-lg p-4 flex flex-col">

      <h1 className="text-xl font-bold text-blue-600 mb-6">
        OFICINA CONTABLE MJ
      </h1>

      <nav className="space-y-2">
        {menu.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`w-full flex items-center gap-2 px-4 py-2 rounded text-left transition
              ${
                pathname === item.path
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-200"
              }
            `}
          >
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </button>
        ))}
      </nav>

      <div className="flex-1" />

      <button
        onClick={logout}
        className="bg-red-500 text-white py-2 rounded"
      >
        🚪 Cerrar sesión
      </button>

    </div>
  );
}