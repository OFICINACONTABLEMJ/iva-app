"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/context/UserContext";

export default function Perfil() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [msg, setMsg] = useState("");

  const [avatar, setAvatar] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(true);

  const { user, setUser } = useUser();

  // 🔄 cargar usuario
  useEffect(() => {
  fetch("/api/auth/me", { credentials: "include" })
    .then((res) => res.json())
    .then((data) => {
      const u = data.user || data; // 🔥 soporta ambos formatos

      if (u) {
        setNombre(u.nombre || "");
        setEmail(u.email || "");
        setAvatar(u.avatar || "");
        setUser(u);
      }
    })
    .finally(() => {
      setLoading(false);
    });
}, []);

  // 📷 seleccionar imagen
  const handleFileChange = async (e: any) => {
  const selected = e.target.files?.[0];
  if (!selected) return;

  const tipos = ["image/jpeg", "image/png", "image/webp"];

  if (!tipos.includes(selected.type)) {
    alert("Solo JPG, PNG o WEBP");
    return;
  }

  if (selected.size > 2 * 1024 * 1024) {
    alert("Máximo 2MB");
    return;
  }

  setFile(selected);

  const previewUrl = URL.createObjectURL(selected);
  setPreview(previewUrl);
};

  // 💾 GUARDAR
  const guardar = async () => {
  setMsg("");

  try {
    // 🔥 VALIDAR SI HAY CAMBIOS
    if (!nombre && !email && !file && !newPassword) {
      setMsg("❌ No hay cambios para guardar");
      return;
    }

    // 🔥 VALIDAR EMAIL SOLO SI VIENE
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMsg("❌ Correo inválido");
      return;
    }

    let avatarUrl = avatar;

    // 📷 SUBIR IMAGEN (SI HAY)
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      const upload = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await upload.json();

      if (!upload.ok || !uploadData.url) {
        setMsg("❌ Error al subir imagen");
        return;
      }

      avatarUrl = uploadData.url;
    }

    // 🔥 ARMAR BODY DINÁMICO (SOLO LO QUE CAMBIA)
    const bodyData: any = {};

    if (nombre && nombre.trim() !== "") {
      bodyData.nombre = nombre.trim();
    }

    if (email && email.trim() !== "") {
      bodyData.email = email.trim().toLowerCase();
    }

    if (avatarUrl && avatarUrl !== avatar) {
      bodyData.avatar = avatarUrl;
    }

    if (newPassword) {
      bodyData.password = password;
      bodyData.newPassword = newPassword;
    }

    // 🔥 PETICIÓN
    const res = await fetch("/api/auth/update", {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
    });

    const data = await res.json();

    if (!res.ok) {
      setMsg(data.error || "Error al actualizar");
      return;
    }

    // 🔥 ACTUALIZAR CONTEXTO
    setUser({
      ...user,
      nombre: bodyData.nombre ?? user?.nombre,
      email: bodyData.email ?? user?.email,
      avatar: avatarUrl ?? user?.avatar,
    });

    // 🔥 LIMPIAR
    setAvatar(avatarUrl);
    setPreview("");
    setFile(null);
    setPassword("");
    setNewPassword("");

    setMsg("✅ Cambios guardados correctamente");

  } catch (err) {
    console.error(err);
    setMsg("❌ Error de conexión");
  }
};

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push("/")}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            ← Volver al inicio
          </button>

          <h1 className="text-2xl font-bold">👤 Perfil</h1>
        </div>

        {/* CARD */}
        <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow space-y-4">
          {/* AVATAR */}
          <div className="flex flex-col items-center gap-3">
            {loading ? (
  <div className="w-20 h-20 rounded-full bg-gray-300 animate-pulse" />
) : (
  <img
  src={preview || avatar || "/default-avatar.png"}
  onError={(e) => {
    (e.target as HTMLImageElement).src = "/default-avatar.png";
  }}
  className="w-20 h-20 rounded-full object-cover"
/>
)}

            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
            />

            <p className="text-xs text-gray-500">
              JPG, PNG o WEBP (máx 2MB)
            </p>
          </div>

          {/* DATOS */}
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Nombre"
          />

          <input
  type="email"
  value={email}
  onChange={(e) => {
    const value = e.target.value;
    setEmail(value);
  }}
  onBlur={() => {
    // 🔥 normaliza solo cuando el usuario termina de escribir
    setEmail((prev) => prev.trim().toLowerCase());
  }}
  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
  placeholder="Correo"
  required
/>

          <hr />

          <h2 className="font-semibold">Cambiar contraseña</h2>

          <input
            type="password"
            placeholder="Contraseña actual"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />

          <input
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />

          <button
            onClick={guardar}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            Guardar cambios
          </button>

          {msg && (
            <p className="text-center text-sm font-semibold">{msg}</p>
          )}
        </div>
      </div>
    </div>
  );
}