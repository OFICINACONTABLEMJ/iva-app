"use client";

import { useEffect, useState, useRef } from "react"; // 🔥 FIX IMPORT
import { useRouter } from "next/navigation";
import { useUser } from "./context/UserContext";
import jsPDF from "jspdf";

type XMLResumen = {
  total: number;
  iva: number;
  cantidad: number;
};
export default function Home() {

  const [comprasXML, setComprasXML] = useState<XMLResumen>({
  total: 0,
  iva: 0,
  cantidad: 0,
});
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

  const [clientes, setClientes] = useState<any[]>([]);
  const [clienteId, setClienteId] = useState("");

  const [loading, setLoading] = useState(true);
  
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
  const cargarClientes = async () => {
  const res = await fetch("/api/clientes");
  const data = await res.json();
  setClientes(data);
};

useEffect(() => {
  cargarClientes();
}, []);

  useEffect(() => {
  cargarCompras();
  verificarBloqueo();
  setComprasXML({
  total: 0,
  iva: 0,
  cantidad: 0,
});
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

      if (data?.user) {
        setUser(data.user); // ✅ correcto
      }
    } catch (err) {
      console.error("Error cargando usuario", err);
    }
  };

  cargarUser();
}, []);
useEffect(() => {
  if (!user) {
    router.push("/login");
  }
}, [user]);


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
        clienteId,
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
  const handleXMLCompras = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  if (bloqueado) {
    alert("Mes bloqueado");
    return;
  }

  const files = Array.from(e.target.files ?? []) as File[];
  if (files.length === 0) return;

  let totalXML = 0;
  let ivaXML = 0;

  const batch: any[] = [];

  // 🔥 MEDICAMENTOS (NO DEDUCIBLE)
  const esMedicamento = (desc: string, emisor: string) => {
    const t = desc.toLowerCase();
    const p = emisor.toLowerCase();

    return (
      /farmacia|medicamento|capsula|jarabe|vitamina|acetaminofen|ibuprofeno/.test(t) ||
      /farmacia|cruz verde|batres|galeno/.test(p)
    );
  };

  // 🔥 CATEGORÍAS
  const detectarCategoria = (desc: string, emisor: string) => {
    const t = desc.toLowerCase();
    const p = emisor.toLowerCase();

    if (/diesel|gasolina|super|regular|premium/.test(t)) return "Combustible";
    if (/internet|luz|agua|telefono|energia/.test(t)) return "Servicios";

    return "Otras compras";
  };

  for (const file of files) {
    try {
      const buffer = await file.arrayBuffer();

      // 🔥 AUTO ENCODING
      let text = new TextDecoder("utf-8").decode(buffer);
      if (text.includes("�")) {
        text = new TextDecoder("iso-8859-1").decode(buffer);
      }

      const xml = new DOMParser().parseFromString(text, "text/xml");

      // 🔥 UUID FACTURA
      const uuidFactura =
        xml.getElementsByTagName("dte:NumeroAutorizacion")[0]?.textContent ||
        xml.getElementsByTagName("NumeroAutorizacion")[0]?.textContent ||
        crypto.randomUUID();

      // 🔥 EMISOR
      const emisor =
        xml.getElementsByTagName("dte:Emisor")[0]?.getAttribute("NombreComercial") ||
        xml.getElementsByTagName("Emisor")[0]?.getAttribute("NombreComercial") ||
        "";

      // 🔥 ITEMS
      const items =
        xml.getElementsByTagName("dte:Item").length > 0
          ? xml.getElementsByTagName("dte:Item")
          : xml.getElementsByTagName("Item");

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        const descripcion =
          item.getElementsByTagName("dte:Descripcion")[0]?.textContent ||
          item.getElementsByTagName("Descripcion")[0]?.textContent ||
          "Item";

        if (!descripcion) continue;

        // ❌ IGNORAR LÍNEAS DE IVA
        if (descripcion.toLowerCase().includes("iva")) continue;

        const total =
          item.getElementsByTagName("dte:Total")[0]?.textContent ||
          item.getElementsByTagName("Total")[0]?.textContent ||
          "0";

        let iva = 0;

        const impuestos =
          item.getElementsByTagName("dte:Impuesto").length > 0
            ? item.getElementsByTagName("dte:Impuesto")
            : item.getElementsByTagName("Impuesto");

        for (let j = 0; j < impuestos.length; j++) {
          const nombre =
            impuestos[j].getElementsByTagName("dte:NombreCorto")[0]?.textContent ||
            impuestos[j].getElementsByTagName("NombreCorto")[0]?.textContent;

          const monto =
            impuestos[j].getElementsByTagName("dte:MontoImpuesto")[0]?.textContent ||
            impuestos[j].getElementsByTagName("MontoImpuesto")[0]?.textContent;

          if (nombre?.toUpperCase() === "IVA") {
            iva += Number(monto || 0);
          }
        }

        const categoria = detectarCategoria(descripcion, emisor);
        const esMed = esMedicamento(descripcion, emisor);

        // 🔥 SUMATORIA SOLO SI ES DEDUCIBLE
        if (!esMed) {
          totalXML += Number(total);
          ivaXML += iva;
        }

        batch.push({
          descripcion: "[XML] " + descripcion,
          categoria,
          total: Number(total),
          base: Number(total) - iva,
          iva,
          mes,
          anio,
          uuid: uuidFactura + "-" + i,
          uuidFactura,
          deducible: !esMed,
        });
      }

    } catch (err) {
      console.error("Error XML:", file.name, err);
    }
  }

  // 🔥 ENVIAR TODO DE UNA (OPTIMIZADO)
  if (batch.length > 0) {
    const res = await fetch("/api/compras/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(batch),
    });

    if (!res.ok) {
      alert("Error al subir XML");
      return;
    }
  }

  // 🔥 ACTUALIZAR UI
  setComprasXML({
    total: totalXML,
    iva: ivaXML,
    cantidad: batch.length,
  });

  await cargarCompras();

  e.target.value = "";
};

const limpiarXML = async () => {
  if (bloqueado) {
    alert("Mes bloqueado");
    return;
  }

  const ok = window.confirm("¿Eliminar todas las compras XML del mes?");
  if (!ok) return;

  try {
    const res = await fetch("/api/compras/xml", {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mes, anio }),
    });

    if (!res.ok) {
      alert("Error al limpiar XML");
      return;
    }

    setComprasXML({
      total: 0,
      iva: 0,
      cantidad: 0,
    });

    await cargarCompras();

  } catch (err) {
    console.error(err);
    alert("Error de conexión");
  }
};
console.log("XML cargados:", comprasXML.cantidad);

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

  const totalComprasXML = comprasXML.total
  const totalIVAXML = comprasXML.total/1.12 * 0.12
  // const cantidadComprasXML = comprasXML.cantidad

  

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
if (!user) {
  return (
    <div className="flex items-center justify-center h-screen text-white">
      Cargando...
    </div>
  );
}
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
<div className="bg-white p-4 rounded-xl shadow mb-4">
  <label className="text-sm font-semibold">Cliente</label>

  <select
  value={clienteId}
  onChange={(e) => setClienteId(e.target.value)}
  disabled={compras.length > 0} // 🔥 AQUÍ VA
  className={`w-full mt-2 p-2 border rounded-lg ${
    compras.length > 0
      ? "bg-gray-200 cursor-not-allowed"
      : ""
  }`}
>
  <option value="">Seleccionar cliente</option>

  {clientes.map((c) => (
    <option key={c.id} value={c.id}>
      {c.nombre} - {c.nit}
    </option>
  ))}
</select>

  <div className="flex justify-between items-center mt-3">

    {/* NUEVO CLIENTE */}
    <button
      onClick={async () => {
        const nombre = prompt("Nombre del cliente");
        const nit = prompt("NIT del cliente");

        if (!nombre || !nit) return;

        await fetch("/api/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // 🔥 IMPORTANTE
          body: JSON.stringify({ nombre, nit }),
        });

        await cargarClientes();
      }}
      className="text-blue-500 text-sm"
    >
      + Nuevo cliente
    </button>

    {/* ELIMINAR */}
    {clienteId && (
      <button
        onClick={async () => {
          const ok = confirm("¿Eliminar este cliente?");
          if (!ok) return;

          await fetch("/api/clientes", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // 🔥 IMPORTANTE
            body: JSON.stringify({ id: clienteId }),
          });

          setClienteId("");
          await cargarClientes();
        }}
        className="text-red-500 text-sm"
      >
        🗑 Eliminar
      </button>
    )}
  </div>
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
  {comprasXML.cantidad > 0 && (
  <button
    disabled={bloqueado}
    onClick={limpiarXML}
    className="mt-2 text-sm text-red-500 hover:text-red-600 transition"
  >
    🗑 Limpiar XML
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
  <p>
    Total XML: <b>Q{comprasXML.total.toFixed(2)}</b>
  </p>

  <p>
    IVA XML: <b>Q{comprasXML.iva.toFixed(2)}</b>
  </p>

  <p className="mt-2 text-xs text-gray-500">
    COMPRAS CARGADAS: <b>{comprasXML.cantidad}</b>
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