"use client";

import { useEffect, useState, useRef } from "react"; // 🔥 FIX IMPORT
import { useRouter } from "next/navigation";
import { useUser } from "./context/UserContext";
import jsPDF from "jspdf";

export default function Home() {
  const router = useRouter();
  const { user, setUser } = useUser();

  const menuRef = useRef<HTMLDivElement>(null);

  const [ventas, setVentas] = useState<number | "">("");
  const [compras, setCompras] = useState<any[]>([]);
  const [categoria, setCategoria] = useState("Combustible");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState<number | "">("");

  const [logo, setLogo] = useState<string | null>(null);

  const [retenciones, setRetenciones] = useState<number | "">("");
  const [retencionesTotal, setRetencionesTotal] = useState(0);

  const [resultado, setResultado] = useState<any>(null);

  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());

  const [menuOpen, setMenuOpen] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);


  const [loading, setLoading] = useState(true);

  // 🔥 XML COMPRAS
  const [comprasXML, setComprasXML] = useState<any[]>([]);
  const xmlRef = useRef<HTMLInputElement>(null);

  // 🔄 CARGAR COMPRAS
  const cargarCompras = async () => {
    const res = await fetch(`/api/compras/mes?mes=${mes}&anio=${anio}`, {
      credentials: "include",
    });

    const data = await res.json();
    setCompras(Array.isArray(data) ? data : []);
  };

  // 🔒 BLOQUEO
  const verificarBloqueo = async () => {
    const res = await fetch(`/api/resumen?mes=${mes}&anio=${anio}`, {
      credentials: "include",
    });

    const data = await res.json();
    setBloqueado(!!data?.bloqueado);
  };

  // 🔐 LOGOUT
  const logout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    setUser(null);
  };

  useEffect(() => {
  cargarCompras();
  verificarBloqueo();
  setComprasXML([]); // solo limpiar al cambiar mes
}, [mes, anio]);

useEffect(() => {
  if (bloqueado) {
    console.log("🔒 Mes bloqueado");
  }
}, [bloqueado]);

  useEffect(() => {
  const handleClickOutside = (e: any) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setMenuOpen(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);
useEffect(() => {
  const cargarUser = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });

      const data = await res.json();

      if (data) {
        setUser(data); // 🔥 ESTE ES EL IMPORTANTE
      }
    } catch (err) {
      console.error("Error cargando usuario");
    }
  };

  cargarUser();
}, []);
useEffect(() => {
  const cargarUser = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });

      const data = await res.json();

      if (data?.user) {
        setUser(data.user); // ✅ SIEMPRE ASÍ
      }
    } catch (err) {
      console.error("Error cargando usuario", err);
    }
  };

  cargarUser();
}, []);


  // ➕ AGREGAR COMPRA
  const agregarCompra = async () => {
    if (monto === "" || Number(monto) <= 0) return;

    const total = Number(monto);
    const base = total / 1.12;
    const iva = total - base;

    const res = await fetch("/api/compras", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        descripcion: categoria === "Otros" ? descripcion : categoria,
        categoria,
        total,
        base,
        iva,
        mes,
        anio,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Error al guardar");
      return;
    }

    setMonto("");
    setDescripcion("");

    await cargarCompras();
  };
  useEffect(() => {
  console.log("XML cargados:", comprasXML);
}, [comprasXML]);

  // 🔥 XML COMPRAS
  const handleXMLCompras = async (e: any) => {

  // 🔒 BLOQUEO FRONTEND
  if (bloqueado) {
    alert("Mes bloqueado, no puedes subir XML");
    return;
  }

  const files = e.target.files;
  if (!files || files.length === 0) return;

  const resultados: any[] = [];

  // 🔥 DETECTOR DE CATEGORÍA
  const detectarCategoria = (descripcion: string, emisor: string) => {
    const texto = (descripcion || "").toLowerCase();
    const proveedor = (emisor || "").toLowerCase();

    // ⛽ COMBUSTIBLE
    if (
      texto.includes("diesel") ||
      texto.includes("gasolina") ||
      texto.includes("super") ||
      texto.includes("regular") ||
      texto.includes("premium") ||
      texto.includes("vp") ||
      proveedor.includes("combustible") ||
      proveedor.includes("texaco") ||
      proveedor.includes("shell")
    ) {
      return "Combustible";
    }

    // 💡 SERVICIOS
    if (
      texto.includes("agua") ||
      texto.includes("luz") ||
      texto.includes("energia") ||
      texto.includes("electricidad") ||
      texto.includes("internet") ||
      texto.includes("cable") ||
      texto.includes("telefono") ||
      texto.includes("servicio") ||
      proveedor.includes("claro") ||
      proveedor.includes("tigo") ||
      proveedor.includes("energuate")
    ) {
      return "Servicios";
    }

    return "Otras compras";
  };

  for (const file of Array.from(files) as File[]) {
    try {
      const text = await file.text();
      const xml = new DOMParser().parseFromString(text, "text/xml");

      // 🔥 UUID
      const auth =
        xml.getElementsByTagName("dte:NumeroAutorizacion")[0] ||
        xml.getElementsByTagName("NumeroAutorizacion")[0];

      const uuid = auth?.textContent?.trim() || "";

      // =========================
      // ✅ TOTAL
      // =========================
      const total =
        xml.getElementsByTagName("dte:GranTotal")[0]?.textContent ||
        xml.getElementsByTagName("GranTotal")[0]?.textContent ||
        "0";

      // =========================
      // ✅ IVA
      // =========================
      const impuestosTotales =
        xml.getElementsByTagName("dte:TotalImpuesto").length > 0
          ? xml.getElementsByTagName("dte:TotalImpuesto")
          : xml.getElementsByTagName("TotalImpuesto");

      let iva = 0;

      for (let i = 0; i < impuestosTotales.length; i++) {
        const imp = impuestosTotales[i];
        const nombre = imp.getAttribute("NombreCorto");
        const monto = imp.getAttribute("TotalMontoImpuesto");

        if (nombre?.toUpperCase() === "IVA") {
          iva += Number(monto || 0);
        }
      }

      // 🔁 FALLBACK IVA
      if (iva === 0) {
        const items =
          xml.getElementsByTagName("dte:Impuesto").length > 0
            ? xml.getElementsByTagName("dte:Impuesto")
            : xml.getElementsByTagName("Impuesto");

        for (let i = 0; i < items.length; i++) {
          const imp = items[i];

          const nombre =
            imp.getElementsByTagName("dte:NombreCorto")[0]?.textContent ||
            imp.getElementsByTagName("NombreCorto")[0]?.textContent;

          const monto =
            imp.getElementsByTagName("dte:MontoImpuesto")[0]?.textContent ||
            imp.getElementsByTagName("MontoImpuesto")[0]?.textContent;

          if (nombre?.toUpperCase() === "IVA") {
            iva += Number(monto || 0);
          }
        }
      }

      // =========================
      // 🔍 DESCRIPCIÓN + EMISOR
      // =========================
      const descripcion =
        xml.getElementsByTagName("dte:Descripcion")[0]?.textContent ||
        xml.getElementsByTagName("Descripcion")[0]?.textContent ||
        "Compra XML";

      const emisor =
        xml.getElementsByTagName("dte:Emisor")[0]?.getAttribute("NombreComercial") ||
        xml.getElementsByTagName("Emisor")[0]?.getAttribute("NombreComercial") ||
        "";

      const categoria = detectarCategoria(descripcion, emisor);

      // =========================
      // 💾 GUARDAR
      // =========================
      const res = await fetch("/api/compras", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          descripcion: "[XML] " + descripcion,
          categoria,
          total: Number(total),
          base: Number(total) - iva,
          iva,
          mes,
          anio,
          uuid,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.log("⚠️", data.error);
        continue;
      }

      resultados.push({
        total: Number(total),
        iva,
        categoria,
      });

    } catch (err) {
      console.error("Error procesando XML:", err);
      continue;
    }
  }

  // 🔄 RECARGAR
  await cargarCompras();

  setComprasXML(resultados);

  // 🔁 RESET INPUT (CLAVE)
  e.target.value = "";
};
console.log("XML cargados:", comprasXML.length);

  const eliminar = async (id: string) => {
  const res = await fetch(`/api/compras/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok) {
    console.error(data);
    alert("Error al eliminar");
    return;
  }

  await cargarCompras();
};

  // ➕ RETENCIÓN
  const agregarRetencion = () => {
    if (retenciones === "" || Number(retenciones) <= 0) return;
    setRetencionesTotal((prev) => prev + Number(retenciones));
    setRetenciones("");
  };

  const totalComprasXML = comprasXML.reduce((acc, i) => acc + i.total, 0);
  const totalIVAXML = comprasXML.reduce((acc, i) => acc + i.iva, 0);

  // 🧮 CALCULAR
  const calcular = () => {
    if (ventas === "" || Number(ventas) <= 0) {
      alert("Ingresa las ventas del mes");
      return;
    }

    const ventasNum = Number(ventas);
    const debito = ventasNum - ventasNum / 1.12;

    const creditoManual = compras.reduce(
      (acc, c) => acc + Number(c.iva),
      0
    );

    const credito = creditoManual + totalIVAXML;

    const iva = debito - credito - retencionesTotal;

    setResultado({ debito, credito, iva });
  };

  // 💾 GUARDAR
  const guardarResumen = async () => {
    if (!resultado) {
      alert("Primero calcula el IVA");
      return;
    }

    if (ventas === "" || Number(ventas) <= 0) {
      alert("Ingresa las ventas del mes");
      return;
    }

    try {
      const res = await fetch("/api/resumen", {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mes,
          anio,
          ventas: Number(ventas),
          debito: resultado.debito,
          credito: resultado.credito,
          iva: resultado.iva,
          retenciones: retencionesTotal,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      alert("Guardado correctamente");
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    }
  };
if (!user) return null;
  return (
  <div className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-gray-900">

    <div className="max-w-5xl mx-auto p-6 space-y-6 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl">

      {/* 🔥 HEADER PRO */}
<div className="flex justify-between items-center text-white">

  <h1 className="text-xl font-bold tracking-wide">
    CALCULADORA DE IVA
  </h1>

  <div className="relative" ref={menuRef}>
    
    <div
      onClick={() => setMenuOpen(!menuOpen)}
      className="flex items-center gap-3 cursor-pointer bg-white/10 px-3 py-2 rounded-xl backdrop-blur-md hover:bg-white/20 transition"
    >
      <span className="text-sm font-medium">
        {user?.nombre}
      </span>

      <img
  src={user?.avatar || "/default-avatar.png"}
  onError={(e) => {
    (e.target as HTMLImageElement).src = "/default-avatar.png";
  }}
  className="w-14 h-14 rounded-full object-cover border-2 border-white/40 shadow-md"
/>
    </div>

    {menuOpen && (
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">

  <button
    onClick={() => {
      router.push("/perfil");
      setMenuOpen(false);
    }}
    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-gray-800 font-medium transition"
  >
    <span className="text-blue-600">👤</span>
    Perfil
  </button>

  <button
    onClick={logout}
    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 font-medium transition border-t"
  >
    <span>🚪</span>
    Cerrar sesión
  </button>

</div>

    )}
  </div>

</div>
      {/* FILTRO */}
      <div className="bg-white p-5 rounded-2xl shadow-md flex gap-4 border border-gray-100">
  <select
    value={mes}
    onChange={(e) => setMes(Number(e.target.value))}
    className="p-3 border border-gray-200 rounded-lg w-1/2 focus:ring-2 focus:ring-blue-500 outline-none"
  >
    {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"].map((m, i) => (
      <option key={i} value={i + 1}>{m}</option>
    ))}
  </select>

  <input
    type="number"
    value={anio}
    onChange={(e) => setAnio(Number(e.target.value))}
    className="p-3 border border-gray-200 rounded-lg w-1/2 focus:ring-2 focus:ring-blue-500 outline-none"
  />
</div>

      {/* VENTAS */}
      <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-white/40">
  <h2 className="font-semibold text-gray-700 mb-2">
    💰 Ventas del mes
  </h2>

  <input
    type="number"
    value={ventas}
    onChange={(e) => setVentas(e.target.value === "" ? "" : Number(e.target.value))}
    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
  />
</div>

      {/* COMPRA */}
      <div className="bg-white p-5 rounded-2xl shadow-md space-y-3 border border-gray-100">
  <h2 className="font-semibold text-gray-700">
    🛒 Agregar compra
  </h2>

  <select
    value={categoria}
    onChange={(e) => setCategoria(e.target.value)}
    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
  >
    <option>Combustible</option>
    <option>Servicios</option>
    <option>Otras compras</option>
    <option>Otros</option>
  </select>

  {categoria === "Otros" && (
    <input
      value={descripcion}
      onChange={(e) => setDescripcion(e.target.value)}
      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      placeholder="Descripción"
    />
  )}

  <input
    type="number"
    value={monto}
    onChange={(e) => setMonto(e.target.value === "" ? "" : Number(e.target.value))}
    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
    placeholder="Monto"
  />

  <button
    onClick={agregarCompra}
    disabled={bloqueado}
    className="w-full bg-green-600 hover:bg-green-700 transition text-white py-3 rounded-lg font-semibold shadow disabled:bg-gray-400"
  >
    + Agregar compra
  </button>
</div>

      {/* XML */}
      <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100">

  {/* HEADER DEL BLOQUE */}
  <div className="flex justify-between items-center mb-3">
  <h2 className="font-semibold text-gray-700">
    📄 Cargar XML de Compras
  </h2>

  {/* 🔥 BOTÓN LIMPIAR */}
  {comprasXML.length > 0 && (
    <button
      disabled={bloqueado}
      onClick={() => {
        if (confirm("¿Eliminar XML cargados?")) {
          setComprasXML([]);
        }
      }}
      className="text-sm text-red-500 hover:text-red-600 transition"
    >
      Limpiar
    </button>
  )}
</div>

  {/* BOTÓN PRINCIPAL */}
  <button
    disabled={bloqueado}
    onClick={() => xmlRef.current?.click()}
    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold shadow transition"
  >
    Subir XML
  </button>

  <input
    ref={xmlRef}
    type="file"
    accept=".xml"
    multiple
    hidden
    onChange={handleXMLCompras}
  />

  {/* INFO */}
  <div className="mt-3 text-sm text-gray-600">
    <p>Total XML: <b>Q{totalComprasXML.toFixed(2)}</b></p>
    <p>IVA XML: <b>Q{totalIVAXML.toFixed(2)}</b></p>

    <p className="mt-2 text-xs text-gray-500">
      XML cargados: <b>{comprasXML.length}</b>
    </p>
  </div>
</div>

      {/* COMPRAS */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-bold mb-2">Compras</h2>

        {compras.length === 0 && (
          <p className="text-gray-500 text-sm">No hay compras registradas</p>
        )}

        {compras.map((c) => (
          <div key={c.id} className="flex justify-between border p-2 rounded mb-2">
            <div>
              <p>{c.descripcion}</p>
              <p className="text-sm text-gray-500">Q{c.total}</p>
            </div>
            <button
  onClick={() => {
    console.log("ID A ELIMINAR:", c.id); // 🔥 DEBUG
    eliminar(c.id);
  }}
  className="text-red-500"
>
  ✕
</button>
          </div>
        ))}
      </div>

      {/* RETENCIONES */}
      <div className="bg-white p-4 rounded-xl shadow space-y-2">
        <h2 className="font-bold">Retenciones</h2>

        <input
          type="number"
          value={retenciones}
          onChange={(e) =>
            setRetenciones(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="w-full p-2 border rounded"
        />

        <button
          onClick={agregarRetencion}
          disabled={bloqueado}
          className="w-full bg-yellow-500 text-white py-2 rounded"
        >
          + Añadir retención
        </button>

        <p className="font-semibold">
          Total: Q{retencionesTotal.toFixed(2)}
        </p>
      </div>

      {/* CALCULAR */}
     <button
  disabled={bloqueado}
  onClick={calcular}
  className="w-full bg-blue-600 hover:bg-purple-700 transition text-white py-3 rounded-xl font-semibold shadow disabled:bg-gray-400"
>
  Calcular IVA
</button>

<button
  onClick={guardarResumen}
  disabled={bloqueado}
  className="w-full bg-purple-600 hover:bg-purple-700 transition text-white py-3 rounded-xl font-semibold shadow disabled:bg-gray-400"
>
  Guardar
</button>

      {bloqueado && (
        <p className="text-red-500 text-center font-semibold">
          🔒 Este mes está bloqueado
        </p>
      )}

      {/* RESULTADO */}
      {resultado && (
        <div className="bg-white p-4 rounded-xl shadow">
          <p>Débito: Q{resultado.debito.toFixed(2)}</p>
          <p>Crédito: Q{resultado.credito.toFixed(2)}</p>
          <p className="text-xl font-bold mt-2">
            IVA: Q{resultado.iva.toFixed(2)}
          </p>
        </div>
      )}

    </div> 
  </div>   
);
}