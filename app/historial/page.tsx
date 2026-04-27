"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

type Compra = {
  id: string;
  descripcion: string;
  categoria: string;
  total: number;
  base?: number;
  iva?: number;
  mes: number;
  anio: number;
  createdAt?: string;
};

type Resumen = {
  ventas: number;
  debito: number;
  credito: number;
  retenciones: number;
  iva: number;
  bloqueado?: boolean;
};

export default function Historial() {
  const router = useRouter();

  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);
  const [anio, setAnio] = useState<number>(new Date().getFullYear());

  const [compras, setCompras] = useState<Compra[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [loadingCompras, setLoadingCompras] = useState(false);
  const [loadingResumen, setLoadingResumen] = useState(false);

  // ============================
  // API CALLS
  // ============================

  const cargarCompras = async () => {
    try {
      setLoadingCompras(true);
      const res = await fetch(`/api/compras/mes?mes=${mes}&anio=${anio}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Error API compras:", data);
        setCompras([]);
        return;
      }

      setCompras(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetch compras:", err);
      setCompras([]);
    } finally {
      setLoadingCompras(false);
    }
  };

  const cargarResumen = async () => {
    try {
      setLoadingResumen(true);
      const res = await fetch(`/api/resumen?mes=${mes}&anio=${anio}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Error API resumen:", data);
        setResumen(null);
        return;
      }

      setResumen(data);
    } catch (err) {
      console.error("Error fetch resumen:", err);
      setResumen(null);
    } finally {
      setLoadingResumen(false);
    }
  };

  useEffect(() => {
    cargarCompras();
    cargarResumen();
  }, [mes, anio]);

  // ============================
  // HELPERS
  // ============================

  const totalCompras = useMemo(() => {
    return compras.reduce((acc, c) => acc + Number(c.total || 0), 0);
  }, [compras]);

  const nombreMes = useMemo(() => {
    const meses = [
      "Enero","Febrero","Marzo","Abril","Mayo","Junio",
      "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
    ];
    return meses[mes - 1] || "";
  }, [mes]);

  // ============================
  // PDF
  // ============================
  
const generarPDF = () => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();

  // =========================
  // 🔥 HEADER
  // =========================
  const drawHeader = () => {
    try {
      pdf.addImage("/logo.png", "PNG", 14, 10, 15, 15);
    } catch {}

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(79, 70, 229);
    pdf.text("OFICINA CONTABLE MJ", 32, 15);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(100);
    pdf.text("Sistema de control fiscal", 32, 20);

    pdf.setFontSize(9);
    pdf.setTextColor(0);
    pdf.text(`Fecha: ${new Date().toLocaleDateString()}`, pageWidth - 60, 15);
    pdf.text(`Periodo: ${nombreMes} ${anio}`, pageWidth - 60, 20);

    pdf.setDrawColor(79, 70, 229);
    pdf.setLineWidth(0.8);
    pdf.line(14, 27, pageWidth - 14, 27);
  };

  // =========================
  // 🔥 FOOTER
  // =========================
  const drawFooter = () => {
    pdf.setFontSize(8);
    pdf.setTextColor(120);
    pdf.text(
      `Página ${pdf.getNumberOfPages()}`,
      pageWidth - 20,
      290,
      { align: "right" }
    );
  };

  drawHeader();

  // =========================
  // TITULO
  // =========================
  pdf.setFontSize(14);
  pdf.setTextColor(0);
  pdf.text("REPORTE DE IVA MENSUAL", pageWidth / 2, 35, {
    align: "center",
  });

  // =========================
  // RESUMEN
  // =========================
  const drawBox = (label: string, value: string, x: number) => {
    pdf.setFillColor(243, 244, 246);
    pdf.roundedRect(x, 42, 40, 15, 3, 3, "F");

    pdf.setFontSize(8);
    pdf.setTextColor(120);
    pdf.text(label, x + 2, 47);

    pdf.setFontSize(10);
    pdf.setTextColor(0);
    pdf.text(value, x + 2, 53);
  };

  drawBox("Ventas", `Q${resumen?.ventas?.toFixed(2)}`, 14);
  drawBox("Débito", `Q${resumen?.debito?.toFixed(2)}`, 58);
  drawBox("Crédito", `Q${resumen?.credito?.toFixed(2)}`, 102);
  drawBox("Retenciones", `Q${resumen?.retenciones?.toFixed(2)}`, 146);

  // =========================
  // IVA
  // =========================
  pdf.setFillColor(238, 242, 255);
  pdf.roundedRect(14, 62, pageWidth - 28, 18, 4, 4, "F");

  pdf.setFontSize(9);
  pdf.setTextColor(80);
  pdf.text("IVA A PAGAR", pageWidth / 2, 70, { align: "center" });

  pdf.setFontSize(18);
  pdf.setTextColor(220, 38, 38);
  pdf.text(`Q${resumen?.iva?.toFixed(2)}`, pageWidth / 2, 77, {
    align: "center",
  });

  // =========================
  // TABLA
  // =========================
  const rows = compras.map((c, i) => [
    i + 1,
    c.descripcion,
    c.categoria,
    `Q${Number(c.total).toFixed(2)}`,
  ]);

  autoTable(pdf, {
    startY: 85,
    head: [["#", "Descripción", "Categoría", "Total"]],
    body: rows,

    theme: "grid",

    styles: {
      fontSize: 9,
      cellPadding: 2,
      overflow: "linebreak",
    },

    headStyles: {
      fillColor: [229, 231, 235],
      textColor: 0,
      fontStyle: "bold",
    },

    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 90 },
      2: { cellWidth: 40 },
      3: { halign: "right", cellWidth: 30 },
    },

    // 🔥 CLAVE: PAGINACIÓN AUTOMÁTICA
    pageBreak: "auto",
    rowPageBreak: "auto",

    didDrawPage: () => {
      drawHeader();
      drawFooter();
    },
  });

  // =========================
  // TOTALES
  // =========================
  let finalY = (pdf as any).lastAutoTable.finalY + 10;

  // 🔥 SI NO CABE → NUEVA PÁGINA
  if (finalY > 260) {
    pdf.addPage();
    drawHeader();
    drawFooter();
    finalY = 30;
  }

  const totales: any = {};
  compras.forEach((c) => {
    if (!totales[c.categoria]) totales[c.categoria] = 0;
    totales[c.categoria] += Number(c.total);
  });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);

  pdf.text(`TOTAL COMPRAS:`, 130, finalY);
  pdf.text(`Q${totalCompras.toFixed(2)}`, 190, finalY, { align: "right" });

  finalY += 6;

  Object.keys(totales).forEach((cat) => {
    pdf.text(`TOTAL ${cat.toUpperCase()}:`, 130, finalY);
    pdf.text(`Q${totales[cat].toFixed(2)}`, 190, finalY, {
      align: "right",
    });
    finalY += 6;
  });

  pdf.save(`IVA_${mes}_${anio}.pdf`);
};

  // ============================
  // STYLES (PDF inline)
  // ============================

  const th = {
    padding: "8px",
    borderBottom: "1px solid #ddd",
    textAlign: "left" as const,
    fontSize: "12px",
  };

  const td = {
    padding: "8px",
    borderBottom: "1px solid #eee",
    fontSize: "12px",
  };

  const box = {
    background: "#f9fafb",
    padding: "10px",
    borderRadius: "8px",
    textAlign: "center" as const,
  };

  const label = {
    fontSize: "11px",
    color: "#666",
  };

  const value = {
    fontWeight: "bold",
    fontSize: "13px",
  };

  // ============================
  // UI
  // ============================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-6">

      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push("/")}
            className="bg-white px-4 py-2 rounded-lg shadow hover:bg-gray-100"
          >
            ← Volver
          </button>

          <h1 className="text-2xl font-bold text-white">
            📊 Historial mensual
          </h1>
        </div>

        {/* FILTRO */}
        <div className="bg-white p-5 rounded-2xl shadow-md flex gap-4">
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="p-3 border rounded-lg w-1/2"
          >
            {[
              "Enero","Febrero","Marzo","Abril","Mayo","Junio",
              "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
            ].map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>

          <input
            type="number"
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="p-3 border rounded-lg w-1/2"
          />
        </div>

        {/* RESUMEN */}
        <div className="bg-white p-6 rounded-2xl shadow-md">

          <h2 className="font-semibold text-gray-700 mb-4">
            📄 Resumen del mes
          </h2>

          {loadingResumen ? (
            <p>Cargando...</p>
          ) : resumen ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                <div className="bg-gray-100 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">VENTAS</p>
                  <p className="font-bold">Q{resumen.ventas?.toFixed(2)}</p>
                </div>

                <div className="bg-gray-100 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">DEBITO "VENTAS"</p>
                  <p className="font-bold">Q{resumen.debito?.toFixed(2)}</p>
                </div>

                <div className="bg-gray-100 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">CREDITO "COMPRAS"</p>
                  <p className="font-bold">Q{resumen.credito?.toFixed(2)}</p>
                </div>

                <div className="bg-gray-100 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">RETENCIONES</p>
                  <p className="font-bold">Q{resumen.retenciones?.toFixed(2)}</p>
                </div>

              </div>

              <div className="mt-6 bg-blue-50 border border-blue-200 p-4 rounded-xl text-center">
                <p className="text-sm text-gray-600">IVA A PAGAR</p>
                <p className="text-3xl font-bold text-red-600">
                  Q{resumen.iva?.toFixed(2)}
                </p>

                {resumen.bloqueado && (
                  <p className="text-red-500 font-semibold mt-2">
                    🔒 Mes cerrado
                  </p>
                )}
              </div>
            </>
          ) : (
            <p>No hay datos</p>
          )}

          <button
            onClick={generarPDF}
            className="w-full mt-6 bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-semibold shadow"
          >
            📄 Exportar PDF
          </button>

        </div>
      </div>

      {/* ============================
          PDF TEMPLATE (OCULTO)
      ============================ */}
      <div
        id="factura-pdf"
        style={{
          width: "800px",
          padding: "40px",
          background: "white",
          display: "none",
          fontFamily: "Arial",
        }}
      >

        {/* HEADER */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "3px solid #4f46e5",
          paddingBottom: "10px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src="/logo.png" style={{ width: "50px", height: "50px" }} />
            <div>
              <h1 style={{ fontSize: "20px", color: "#4f46e5", fontWeight: "bold" }}>
                OFICINA CONTABLE MJ
              </h1>
              <p style={{ fontSize: "12px", color: "#555" }}>
                Sistema de control fiscal
              </p>
            </div>
          </div>

          <div style={{ textAlign: "right", fontSize: "12px" }}>
            <p><strong>Fecha:</strong> {new Date().toLocaleDateString()}</p>
            <p><strong>Periodo:</strong> {nombreMes} {anio}</p>
          </div>
        </div>

        {/* TITULO */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold" }}>
            REPORTE DE IVA MENSUAL
          </h2>
        </div>

        {/* RESUMEN PDF */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "10px",
          marginTop: "20px"
        }}>
          <div style={box}>
            <p style={label}>Ventas</p>
            <p style={value}>Q{resumen?.ventas?.toFixed(2)}</p>
          </div>

          <div style={box}>
            <p style={label}>Débito</p>
            <p style={value}>Q{resumen?.debito?.toFixed(2)}</p>
          </div>

          <div style={box}>
            <p style={label}>Crédito</p>
            <p style={value}>Q{resumen?.credito?.toFixed(2)}</p>
          </div>

          <div style={box}>
            <p style={label}>Retenciones</p>
            <p style={value}>Q{resumen?.retenciones?.toFixed(2)}</p>
          </div>
        </div>

        {/* IVA */}
        <div style={{
          marginTop: "25px",
          padding: "20px",
          background: "#eef2ff",
          borderRadius: "10px",
          textAlign: "center",
          border: "1px solid #c7d2fe"
        }}>
          <p style={{ fontSize: "12px" }}>IVA A PAGAR</p>

          <h2 style={{
            fontSize: "28px",
            color: "#dc2626",
            fontWeight: "bold"
          }}>
            Q{resumen?.iva?.toFixed(2)}
          </h2>
        </div>

        {/* TABLA */}
        <table style={{
          width: "100%",
          marginTop: "25px",
          borderCollapse: "collapse"
        }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={th}>#</th>
              <th style={th}>Descripción</th>
              <th style={th}>Categoría</th>
              <th style={th}>Total</th>
            </tr>
          </thead>

          <tbody>
            {compras.map((c, i) => (
              <tr key={c.id}>
                <td style={td}>{i + 1}</td>
                <td style={td}>{c.descripcion}</td>
                <td style={td}>{c.categoria}</td>
                <td style={{ ...td, textAlign: "right" }}>
                  Q{Number(c.total).toFixed(2)}
                </td>
              </tr>
            ))}

            {/* TOTAL */}
            <tr>
  <td colSpan={3} style={{ ...td, fontWeight: "bold" }}>
    TOTAL COMPRAS
  </td>
  <td style={{ ...td, textAlign: "right", fontWeight: "bold" }}>
    Q{totalCompras.toFixed(2)}
  </td>
</tr>

{/* 🔥 TOTALES POR CATEGORÍA */}
{Object.entries(
  compras.reduce((acc: any, c) => {
    acc[c.categoria] = (acc[c.categoria] || 0) + c.total;
    return acc;
  }, {})
).map(([cat, total]: any) => (
  <tr key={cat}>
    <td colSpan={3} style={{ ...td, fontWeight: "bold", background: "#f9fafb" }}>
      TOTAL {cat.toUpperCase()}
    </td>
    <td style={{ ...td, textAlign: "right", fontWeight: "bold" }}>
      Q{total.toFixed(2)}
    </td>
  </tr>
))}
          </tbody>
        </table>
        

        {/* FOOTER */}
        <div style={{
          marginTop: "30px",
          textAlign: "center",
          fontSize: "10px",
          color: "#888"
        }}>
          Documento generado automáticamente • Oficina Contable MJ
        </div>

      </div>
    </div>
  );
}